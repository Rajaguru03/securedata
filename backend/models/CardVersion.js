const mongoose = require('mongoose');

/**
 * CardVersion is immutable snapshot of a Datacard at a point in time.
 *
 * A new document is written here every time a card is updated (PUT /api/cards/:id).
 * Versions are numbered from 1 (original saved state) upward.
 * Encrypted field values are stored as-is (ciphertext) so that a restored version
 * can be written back to the Datacard collection without re-encryption.
 */
const cardVersionSchema = new mongoose.Schema({
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Datacard',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    required: true,
    min: 1
  },
  // Snapshot fields
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  fields: [
    {
      label:     { type: String, maxlength: 50 },
      value:     { type: String, maxlength: 1000, default: '' },
      type:      { type: String, default: 'text' },
      encrypted: { type: Boolean, default: false },
      _id:       false   // no sub document IDs in snapshots
    }
  ],
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
  tags: [{ type: String, maxlength: 30 }],
  // Provenance
  savedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  changeNote: {
    type: String,
    maxlength: 200,
    default: ''
  }
}, {
  // No timestamps savedAt serves as the single temporal anchor
  timestamps: false
});

// Compound indexes for efficient history queries
cardVersionSchema.index({ cardId: 1, version: 1 }, { unique: true });
cardVersionSchema.index({ cardId: 1, savedAt: -1 });

module.exports = mongoose.model('CardVersion', cardVersionSchema);
