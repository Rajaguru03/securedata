const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { logAuthEvent } = require('./auditLogger');

/**
 * Authentication for the middleware
 * Verifies JWT access token and attaches user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Not authorized to access this route. Please log in.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        logAuthEvent('invalid_token', req, { reason: 'user_not_found' });
        return res.status(401).json({
          error: 'User not found. Please log in again.'
        });
      }

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        logAuthEvent('token_expired', req);
        return res.status(401).json({
          error: 'Token expired. Please refresh your session.'
        });
      }
      logAuthEvent('invalid_token', req, { reason: err.message });
      return res.status(401).json({
        error: 'Invalid token. Please log in again.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

/**
 * Generate short lived JWT access token (15 minutes)
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generating a cryptographically random refresh token.
 * Returns { raw, hashed } — store hashed, send raw to client.
 */
const generateRefreshToken = () => {
  const raw = crypto.randomBytes(40).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

module.exports = { protect, generateToken, generateRefreshToken };
