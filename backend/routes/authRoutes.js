const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  updateUser
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, updateUserValidation } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes (with rate limiting)
router.post('/register', authLimiter, registerValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);
router.post('/refresh', refreshAccessToken);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.put('/update', protect, updateUserValidation, updateUser);

module.exports = router;
