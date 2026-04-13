const express = require('express');
const router = express.Router();
const {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  generateShareLink,
  revokeShareLink,
  getSharedCard,
  getShareStats,
  exportCard
} = require('../controllers/cardController');
const { protect } = require('../middleware/auth');
const { datacardValidation, objectIdValidation } = require('../middleware/validator');
const { datacardLimiter } = require('../middleware/rateLimiter');

// Public route for shared cards (no auth required)
router.get('/shared/:token', getSharedCard);

// Protected routes (require authentication)
router.use(protect); // Apply auth middleware to all routes below
router.use(datacardLimiter); // Apply rate limiting

// CRUD operations
router.route('/')
  .get(getCards)
  .post(datacardValidation, createCard);

router.route('/:id')
  .get(objectIdValidation, getCard)
  .put(objectIdValidation, datacardValidation, updateCard)
  .delete(objectIdValidation, deleteCard);

// Share link: generate, revoke, and analytics
router.post('/:id/share', objectIdValidation, generateShareLink);
router.delete('/:id/share', objectIdValidation, revokeShareLink);
router.get('/:id/share/stats', objectIdValidation, getShareStats);

// Export as password-protected PDF
router.post('/:id/export', objectIdValidation, exportCard);

module.exports = router;
