const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  profileImage: {
    type: String
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Public user data (exclude sensitive information)
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    email: this.email,
    username: this.username,
    displayName: this.displayName,
    profileImage: this.profileImage,
    isPremium: this.isPremium,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema); 