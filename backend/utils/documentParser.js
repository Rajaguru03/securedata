/**
 * documentParser.js
 *
 * Extracts plain text from uploaded documents for RAG reference.
 * Supported formats: PDF (.pdf), plain text (.txt)
 *
 * All parsing happens in memory no files are written to disk.
 * The extracted text is returned to the caller and immediately discarded.
 *
 * Security hardening:
 *  - PDF magic-byte check (must start with %PDF-)
 *  - Embedded JavaScript / action detection in PDFs
 *  - Null-byte injection detection in text files
 *  - HTML/script tag detection in text files
 */

const pdfParse = require('pdf-parse');

// Maximum characters to extract — matches the referenceText validator limit
const MAX_CHARS = 10000;

// PDF operators that can execute code or launch external processes
const DANGEROUS_PDF_PATTERNS = [
  /\/JavaScript\b/i,
  /\/JS\b/i,
  /\/AA\b/,          // Additional Actions (runs on open/close)
  /\/OpenAction\b/,  // Runs automatically when PDF is opened
  /\/Launch\b/,      // Launches an external application
  /\/SubmitForm\b/,  // Submits form data to remote URL
  /\/GoToR\b/,       // Go-To Remote — opens external file
  /\/URI\s*<<.*\/S\s*\/URI/i, // URI action
];

/**
 * Validate file content for malicious payloads before parsing.
 * Throws with a descriptive error if anything suspicious is found.
 *
 * @param {Buffer} buffer   - raw file bytes
 * @param {string} mimetype - MIME type from multer
 * @param {string} ext      - lowercase file extension (without dot)
 */
const validateFileContent = (buffer, mimetype, ext) => {
  if (mimetype === 'application/pdf' || ext === 'pdf') {
    // 1. Magic bytes — every valid PDF starts with %PDF-
    const header = buffer.slice(0, 5).toString('ascii');
    if (header !== '%PDF-') {
      throw new Error('File rejected: invalid PDF header. The file may be disguised as a PDF.');
    }

    // 2. Scan raw bytes for dangerous PDF operators
    // We inspect a string representation to catch operator names in the cross-reference table
    const raw = buffer.toString('latin1'); // latin1 preserves byte values
    for (const pattern of DANGEROUS_PDF_PATTERNS) {
      if (pattern.test(raw)) {
        throw new Error(`File rejected: PDF contains potentially dangerous content (${pattern.source}). Only plain document PDFs are accepted.`);
      }
    }
    return; // PDF is clean
  }

  // Text / Markdown files
  // 1. Null byte check binary data disguised as text
  if (buffer.includes(0x00)) {
    throw new Error('File rejected: file contains null bytes and may not be a plain text file.');
  }

  // 2. Script/HTML injection in text files
  const text = buffer.toString('utf8');
  if (/<script[\s>]/i.test(text) || /<\/script>/i.test(text)) {
    throw new Error('File rejected: text file contains HTML script tags.');
  }
};

/**
 * Extract text from a PDF buffer.
 * Strips excessive whitespace and trims to MAX_CHARS.
 */
const extractFromPDF = async (buffer) => {
  const data = await pdfParse(buffer);
  const raw = data.text || '';
  return sanitiseExtractedText(raw);
};

/**
 * Extract text from a plain-text buffer.
 */
const extractFromText = (buffer) => {
  const raw = buffer.toString('utf8');
  return sanitiseExtractedText(raw);
};

/**
 * Normalise whitespace and cap at MAX_CHARS.
 * Returns the cleaned text and a flag indicating whether it was truncated.
 */
const sanitiseExtractedText = (raw) => {
  const cleaned = raw
    .replace(/\r\n/g, '\n')          // normalise line endings
    .replace(/[ \t]+/g, ' ')         // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')      // collapse blank lines
    .trim();

  const truncated = cleaned.length > MAX_CHARS;
  return {
    text: cleaned.slice(0, MAX_CHARS),
    truncated,
    charCount: Math.min(cleaned.length, MAX_CHARS),
    originalCharCount: cleaned.length
  };
};

/**
 * Parse an uploaded file buffer based on MIME type or file extension.
 * Throws if the format is unsupported.
 *
 * @param {Buffer} buffer   - file contents
 * @param {string} mimetype - MIME type from multer
 * @param {string} filename - original filename
 */
const parseDocument = async (buffer, mimetype, filename = '') => {
  const ext = filename.split('.').pop().toLowerCase();

  // Security: validate content before parsing
  validateFileContent(buffer, mimetype, ext);

  if (mimetype === 'application/pdf' || ext === 'pdf') {
    return extractFromPDF(buffer);
  }

  if (
    mimetype === 'text/plain' ||
    mimetype === 'text/markdown' ||
    ['txt', 'md', 'csv'].includes(ext)
  ) {
    return extractFromText(buffer);
  }

  throw new Error(
    `Unsupported file type: ${mimetype || ext}. Upload a PDF or plain text file.`
  );
};

module.exports = { parseDocument, MAX_CHARS };
