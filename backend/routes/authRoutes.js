const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  updateUser,
  getProfile,
  forgotPassword,
  resetPassword,
  deleteAccount,
  setup2FA,
  verifySetup2FA,
  disable2FA,
  completeLogin2FA,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, updateUserValidation } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes (with rate limiting)
router.post('/register', authLimiter, registerValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// 2FA — complete login (public, uses temp token for auth)
router.post('/2fa/complete-login', authLimiter, completeLogin2FA);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.get('/profile', protect, getProfile);
router.put('/update', protect, updateUserValidation, updateUser);

// GDPR: right to erasure
router.delete('/account', protect, deleteAccount);

// 2FA management (requires full auth)
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify-setup', protect, verifySetup2FA);
router.post('/2fa/disable', protect, disable2FA);

module.exports = router;
