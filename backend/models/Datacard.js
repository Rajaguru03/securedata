const mongoose = require('mongoose');

// Sub-schema for individual fields
const fieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true,
    maxlength: [50, 'Label cannot exceed 50 characters']
  },
  value: {
    type: String,
    default: '',
    maxlength: [1000, 'Value cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'email', 'phone', 'date', 'url', 'image', 'textarea'],
    default: 'text'
  },
  encrypted: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Main datacard schema
const datacardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Datacard title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  fields: {
    type: [fieldSchema],
    validate: {
      validator: function(fields) {
        return fields.length <= 20; // Maximum 20 fields per card
      },
      message: 'Datacard cannot have more than 20 fields'
    }
  },
  template: {
    type: String,
    enum: ['default', 'professional', 'minimal', 'creative'],
    default: 'default'
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  shareExpiry: {
    type: Date
  },
  sharePasswordHash: {
    type: String,
    default: null,
    select: false // Never returned in normal queries
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  generatedByLLM: {
    type: Boolean,
    default: false
  },
  // Version tracking — incremented on every update; history stored in CardVersion collection
  currentVersion: {
    type: Number,
    default: 1,
    min: 1
  },
  // Share link view tracking (fast counters — full history in ShareView collection)
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastViewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
datacardSchema.index({ userId: 1, createdAt: -1 });

// Virtual for checking if share link is expired
datacardSchema.virtual('isShareExpired').get(function() {
  if (!this.shareExpiry) return false;
  return new Date() > this.shareExpiry;
});

module.exports = mongoose.model('Datacard', datacardSchema);
