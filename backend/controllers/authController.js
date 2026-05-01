const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { logAuthEvent } = require('../middleware/auditLogger');

// Refresh token cookie option
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,       // Not accessible through JS
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  is public
 */


const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
// Checks for the existing user and report it as the duplicate email
    const existUser = await User.findOne({ email });
    if (existUser) {
      logAuthEvent('register_duplicate', req);
      return res.status(400).json({
        error: 'This Email id already exists'
      });
    }
// Creating the users and passwd is hashed in the user model
    const user = await User.create({ name, email, password });

    const access_Token = generateToken(user._id);
    const { raw: refreshRaw, hashed: refreshHashed } = generateRefreshToken();

    await User.findByIdAndUpdate(user._id, { refreshToken: refreshHashed });

    logAuthEvent('register', req, { userId: user._id });
// sets the raw token as cookie
    res.cookie('refreshToken', refreshRaw, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      message: 'Registration',
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token: access_Token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Try again.' });
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

    // Checks for the account lock
    if (user.isLocked) {
      const remainingMs = user.lockUntil - new Date();
      const remainingMins = Math.ceil(remainingMs / 60000);
      logAuthEvent('login_failure', req, { userId: user._id, reason: 'Sorry Account Locked' });
      return res.status(423).json({
        error: `Account locked due to many failed attempts. Try again in ${remainingMins} minute${remainingMins !== 1 ? 's' : ''}.`
      });
    }

    const ifMatch = await user.comparePassword(password);
    if (!ifMatch) {
      await user.incrementLoginAttempts();
      const attemptsAfter = user.loginAttempts + 1;
      const remaining = Math.max(0, 5 - attemptsAfter);
      logAuthEvent('login_failure', req, { userId: user._id, reason: 'Wrong Password', attempts: attemptsAfter });
      return res.status(401).json({
        error: remaining > 0
          ? `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
          : 'Invalid email or password. Account is now locked for 15 minutes.'
      });
    }

    // Successful login and reset lockout
    await user.resetLoginAttempts();

    const access_Token = generateToken(user._id);
    const { raw: refreshRaw, hashed: refreshHashed } = generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken: refreshHashed });

    logAuthEvent('Login Success', req, { userId: user._id });

    res.cookie('refreshToken', refreshRaw, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        token: access_Token
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
      return res.status(401).json({ error: 'There is no refresh token provided.' });
    }

    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await User.findOne({ refreshToken: hashed }).select('+refreshToken');

    if (!user) {
      logAuthEvent('invalid refresh token', req, { reason: 'not found' });
      return res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' });
    }

    // Rotating the issue new access token and new refresh token
    const access_Token = generateToken(user._id);
    const { raw: refreshRaw, hashed: refreshHashed } = generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken: refreshHashed });

    logAuthEvent('token_refreshed', req, { userId: user._id });

    res.cookie('refreshToken', refreshRaw, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      data: { token: access_Token }
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
      const existUser = await User.findOne({ email });
      if (existUser) {
        return res.status(400).json({ error: 'This Email already in use' });
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

/**
 * @desc    Get user profile with card stats and shared cards
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const Datacard = require('../models/Datacard');
    const user = await User.findById(req.user.id);

    const [totalCards, sharedCards] = await Promise.all([
      Datacard.countDocuments({ userId: req.user.id }),
      Datacard.find({
        userId: req.user.id,
        shareToken: { $exists: true, $ne: null }
      }).select('title shareToken shareExpiry viewCount lastViewedAt createdAt').sort({ createdAt: -1 })
    ]);

    const totalViews = sharedCards.reduce((sum, c) => sum + (c.viewCount || 0), 0);
    const activeShared = sharedCards.filter(c => !c.shareExpiry || new Date(c.shareExpiry) > new Date());

    res.status(200).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
        stats: { totalCards, totalShared: sharedCards.length, activeShared: activeShared.length, totalViews },
        sharedCards: sharedCards.map(c => ({
          id: c._id,
          title: c.title,
          shareToken: c.shareToken,
          shareExpiry: c.shareExpiry,
          viewCount: c.viewCount,
          lastViewedAt: c.lastViewedAt,
          createdAt: c.createdAt,
          isExpired: c.shareExpiry ? new Date() > new Date(c.shareExpiry) : false,
        }))
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

/**
 * @desc    Send password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashed,
      resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    res.status(200).json({ success: true, resetUrl });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

// ─── GDPR: Right to Erasure ─────────────────────────────────────────────────

/**
 * @desc    Delete account and all associated data (GDPR Art. 17)
 * @route   DELETE /api/auth/account
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to confirm account deletion.' });

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const ifMatch = await user.comparePassword(password);
    if (!ifMatch) {
      logAuthEvent('deleteaccount_wrong_password', req, { userId: req.user.id });
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const Datacard    = require('../models/Datacard');
    const CardVersion = require('../models/CardVersion');

    // Find all cards belonging to this user
    const cardId = (await Datacard.find({ userId: req.user.id }).select('_id')).map(c => c._id);

    // Delete versions and cards
    await CardVersion.deleteMany({ cardId: { $in: cardId } });
    await Datacard.deleteMany({ userId: req.user.id });

    // Delete the user account
    await User.findByIdAndDelete(req.user.id);

    // Clear session cookie
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

    logAuthEvent('account_deleted', req, { userId: req.user.id, cardsDeleted: cardId.length });

    res.status(200).json({ success: true, message: 'Account and all associated data have been permanently deleted.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
};

module.exports = {
  registerUser, loginUser, refreshAccessToken, logoutUser,
  getMe, updateUser, getProfile, forgotPassword, resetPassword,
  deleteAccount,
};
