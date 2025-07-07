const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate follows and improve query performance
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

// Prevent users from following themselves
followSchema.pre('save', function(next) {
  if (this.follower.equals(this.following)) {
    const error = new Error('Users cannot follow themselves');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Follow', followSchema);