const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { generateContent, getTemplates, extractDocument } = require('../controllers/llmController');
const { protect }             = require('../middleware/auth');
const { llmPromptValidation } = require('../middleware/validator');
const { llmLimiter }          = require('../middleware/rateLimiter');
const { promptSanitizer }     = require('../middleware/promptSanitizer');

// Multer memory storage only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown'];
    const allowedExt = ['.pdf', '.txt', '.md'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and MD files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(protect);

// Get available templates/suggestions
router.get('/templates', getTemplates);

// Extract text from an uploaded document (for RAG reference)
// Rate limited same as generation to prevent bulk scraping
router.post(
  '/extract-document',
  llmLimiter,
  (req, res, next) => {
    upload.single('document')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  extractDocument
);

// Generates datacard content
router.post('/', llmLimiter, llmPromptValidation, promptSanitizer, generateContent);

module.exports = router;
