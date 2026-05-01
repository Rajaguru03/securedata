const mongoose = require('mongoose');
const crypto = require('crypto');

const shareViewSchema = new mongoose.Schema({
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Datacard',
    required: true,
    index: true
  },
  // IP stored as a one way SHA-256 hash GDPR-friendly unique visitor counting
  ipHash: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    maxlength: 500,
    default: 'unknown'
  },
  // Coarse device category derived from user agent at write time
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'bot', 'unknown'],
    default: 'unknown'
  },
  browser: {
    type: String,
    maxlength: 100,
    default: 'unknown'
  },
  referrer: {
    type: String,
    maxlength: 500,
    default: null
  },
  // Geolocation derived from IP at view time (offline lookup no raw IP stored)
  country: {
    type: String,
    maxlength: 2,   
    default: null
  },
  city: {
    type: String,
    maxlength: 100,
    default: null
  },
  timezone: {
    type: String,
    maxlength: 60, 
    default: null
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { versionKey: false });

// Compound index for per card analytics queries
shareViewSchema.index({ cardId: 1, viewedAt: -1 });

/**
 * Hashing an IP address so we can count unique visitors without storing raw IPs.
 */
shareViewSchema.statics.hashIp = function (ip) {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
};

/**
 * Infer the browser name from the User Agent string.
 */
shareViewSchema.statics.parseBrowser = function (ua = '') {
  if (!ua || ua === 'unknown') return 'unknown';
  const s = ua.toLowerCase();
  if (/bot|crawler|spider|curl|wget|python|java|go-http|httpclient/i.test(s)) return 'bot';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/samsungbrowser/i.test(ua)) return 'Samsung Browser';
  if (/ucbrowser/i.test(ua)) return 'UC Browser';
  if (/firefox\/|fxios\//i.test(ua)) return 'Firefox';
  if (/chrome\/|crios\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/msie |trident\//i.test(ua)) return 'Internet Explorer';
  return 'unknown';
};

/**
 * Infer a coarse device category from the User Agent string.
 */
shareViewSchema.statics.parseDeviceType = function (ua = '') {
  const s = ua.toLowerCase();
  if (!ua || s === 'unknown') return 'unknown';
  if (/bot|crawler|spider|curl|wget|python|java|go-http|httpclient/i.test(s)) return 'bot';
  if (/mobi|android|iphone|ipod|blackberry|windows phone/i.test(s)) return 'mobile';
  if (/ipad|tablet|kindle|playbook/i.test(s)) return 'tablet';
  return 'desktop';
};

module.exports = mongoose.model('ShareView', shareViewSchema);
