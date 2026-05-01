const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Account lockout fields
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  // Refresh token (hashed) for rotation
  refreshToken: {
    type: String,
    default: null,
    select: false
  },
  // Password reset
  resetPasswordToken: {
    type: String,
    default: null,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
});

// Hashing password before saving
userSchema.pre('save', async function() {
  // Only hash if password is modified
  if (!this.isModified('password')) return;

  // Generates salt and hash password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Checks if account is currently locked
userSchema.virtual('isLocked').get(function() {
  return this.lockUntil && this.lockUntil > new Date();
});

// Increment failed login attempts  lock account if threshold reached
userSchema.methods.incrementLoginAttempts = async function() {
  // If previous lock has expired, reset and start fresh
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({ $set: { loginAttempts: 1, lockUntil: null } });
  }
  const update = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }
  return this.updateOne(update);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({ $set: { loginAttempts: 0, lockUntil: null } });
};

module.exports = mongoose.model('User', userSchema);
