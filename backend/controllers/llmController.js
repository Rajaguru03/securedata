const { generateDatacard } = require('../utils/llmService');
const { parseDocument } = require('../utils/documentParser');

/**
 * @desc    Generate datacard content using LLM
 * @route   POST /api/generate
 * @access  Private
 */
const generateContent = async (req, res) => {
  try {
    const { prompt, referenceText } = req.body;

    // sanitizePrompt is applied inside generateDatacard (llmService.js)
    // referenceText is optional — when provided, RAG retrieval grounds the output
    const generatedCard = await generateDatacard(prompt, referenceText || '');

    // Strip internal ragUsed flag from the card object before returning
    const { ragUsed, ...cardData } = generatedCard;

    res.status(200).json({
      success: true,
      message: 'Datacard content generated successfully',
      data: {
        generated: cardData,
        generatedByLLM: true,
        ragUsed: !!ragUsed
      }
    });
  } catch (error) {
    console.error('LLM generation error:', error);

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'API rate limit reached. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to generate content. Please try again.'
    });
  }
};

/**
 * @desc    Get available templates/suggestions
 * @route   GET /api/generate/templates
 * @access  Private
 */
const getTemplates = async (req, res) => {
  const templates = [
    {
      id: 'professional',
      name: 'Professional Profile',
      description: 'Business card style with name, title, contact info',
      examplePrompt: 'Create a professional profile card for a software engineer'
    },
    {
      id: 'personal',
      name: 'Personal Card',
      description: 'Personal information card with hobbies and interests',
      examplePrompt: 'Create a personal card showcasing hobbies and interests'
    },
    {
      id: 'student',
      name: 'Student ID',
      description: 'Academic information card for students',
      examplePrompt: 'Create a student information card for a university student'
    },
    {
      id: 'contact',
      name: 'Contact Card',
      description: 'Simple contact information card',
      examplePrompt: 'Create a contact card with phone, email, and address'
    },
    {
      id: 'project',
      name: 'Project Card',
      description: 'Project summary card with key details',
      examplePrompt: 'Create a project summary card for a web application'
    }
  ];

  res.status(200).json({
    success: true,
    data: { templates }
  });
};

/**
 * @desc    Extract text from an uploaded PDF or .txt file for RAG use
 * @route   POST /api/generate/extract-document
 * @access  Private
 */
const extractDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, mimetype, originalname, size } = req.file;

    // Size guard (5 MB hard cap — multer also enforces this)
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Maximum size is 5 MB.' });
    }

    const { text, truncated, charCount, originalCharCount } = await parseDocument(
      buffer,
      mimetype,
      originalname
    );

    if (!text || text.trim().length < 20) {
      return res.status(422).json({
        error: 'Could not extract readable text from this file. Make sure it is not a scanned image PDF.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        text,
        charCount,
        truncated,
        originalCharCount,
        filename: originalname
      }
    });
  } catch (error) {
    console.error('Document extraction error:', error.message);

    if (error.message.startsWith('Unsupported file type')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to extract text from document.' });
  }
};

module.exports = { generateContent, getTemplates, extractDocument };
