const { generateDatacard } = require('../utils/llmService');

/**
 * @desc    Generate datacard content using LLM
 * @route   POST /api/generate
 * @access  Private
 */
const generateContent = async (req, res) => {
  try {
    const { prompt } = req.body;

    // sanitizePrompt is applied inside generateDatacard (llmService.js)
    const generatedCard = await generateDatacard(prompt);

    res.status(200).json({
      success: true,
      message: 'Datacard content generated successfully',
      data: {
        generated: generatedCard,
        generatedByLLM: true
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

module.exports = { generateContent, getTemplates };
