/**
 * documentParser.js
 *
 * Extracts plain text from uploaded documents for RAG reference.
 * Supported formats: PDF (.pdf), plain text (.txt)
 *
 * All parsing happens in memory — no files are written to disk.
 * The extracted text is returned to the caller and immediately discarded.
 */

const pdfParse = require('pdf-parse');

// Maximum characters to extract — matches the referenceText validator limit
const MAX_CHARS = 10000;

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
