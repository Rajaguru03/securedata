const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { logAuthEvent } = require('../middleware/auditLogger');

// Refresh token cookie options
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,       // Not accessible via JS
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logAuthEvent('register_duplicate', req);
      return res.status(400).json({
        error: 'An account with this email already exists'
      });
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateToken(user._id);
    const { raw: refreshRaw, hashed: refreshHashed } = generateRefreshToken();

    await User.findByIdAndUpdate(user._id, { refreshToken: refreshHashed });

    logAuthEvent('register', req, { userId: user._id });

    res.cookie('refreshToken', refreshRaw, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token: accessToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshToken');

    if (!user) {
      logAuthEvent('login_failure', req, { reason: 'user_not_found' });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check account lock
    if (user.isLocked) {
      const remainingMs = user.lockUntil - new Date();
      const remainingMins = Math.ceil(remainingMs / 60000);
      logAuthEvent('login_failure', req, { userId: user._id, reason: 'account_locked' });
      return res.status(423).json({
        error: `Account locked due to too many failed attempts. Try again in ${remainingMins} minute${remainingMins !== 1 ? 's' : ''}.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      const attemptsAfter = user.loginAttempts + 1;
      const remaining = Math.max(0, 5 - attemptsAfter);
      logAuthEvent('login_failure', req, { userId: user._id, reason: 'wrong_password', attempts: attemptsAfter });
      return res.status(401).json({
        error: remaining > 0
          ? `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
          : 'Invalid email or password. Account is now locked for 15 minutes.'
      });
    }

    // Successful login — reset lockout
    await user.resetLoginAttempts();

    const accessToken = generateToken(user._id);
    const { raw: refreshRaw, hashed: refreshHashed } = generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken: refreshHashed });

    logAuthEvent('login_success', req, { userId: user._id });

    res.cookie('refreshToken', refreshRaw, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token: accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * @desc    Refresh access token using refresh token cookie
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshAccessToken = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await User.findOne({ refreshToken: hashed }).select('+refreshToken');

    if (!user) {
      logAuthEvent('invalid_refresh_token', req, { reason: 'not_found' });
      return res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' });
    }

    // Rotate: issue new access token and new refresh token
    const accessToken = generateToken(user._id);
    const { raw: refreshRaw, hashed: refreshHashed } = generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken: refreshHashed });

    logAuthEvent('token_refreshed', req, { userId: user._id });

    res.cookie('refreshToken', refreshRaw, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      data: { token: accessToken }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh session.' });
  }
};

/**
 * @desc    Logout — invalidate refresh token
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    logAuthEvent('logout', req, { userId: req.user.id });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed.' });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user information' });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/update
 * @access  Private
 */
const updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: { id: user._id, name: user.name, email: user.email } }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser, getMe, updateUser };
