const express = require('express');
const router = express.Router();
const { generateContent, getTemplates } = require('../controllers/llmController');
const { protect } = require('../middleware/auth');
const { llmPromptValidation } = require('../middleware/validator');
const { llmLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// Get available templates/suggestions
router.get('/templates', getTemplates);

// Generate datacard content (with strict rate limiting)
router.post('/', llmLimiter, llmPromptValidation, generateContent);

module.exports = router;
