const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: { 
    type: String, 
    required: function() {
      return !this.googleId && !this.facebookId && !this.appleId;
    },
    minlength: 6
  },
  displayName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  profileImage: { 
    type: String, 
    default: '' 
  },
  profileImagePublicId: { 
    type: String, 
    default: '' 
  },
  dateOfBirth: {
    type: Date
  },
  country: {
    type: String,
    default: 'US'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  
  // Social login IDs
  googleId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  appleId: { type: String, sparse: true },
  
  // Account status
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  
  // Verification tokens
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  // User preferences
  preferences: {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      showRecentActivity: { type: Boolean, default: true },
      showPlaylists: { type: Boolean, default: true },
      allowFollows: { type: Boolean, default: true }
    }
  },
  
  // Statistics
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  // Only hash if password exists (for social logins)
  if (this.password) {
    try {
      // Hash password with cost of 12
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate username from email
userSchema.statics.generateUsername = async function(email) {
  let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
  
  // Ensure username meets minimum length requirement (3 characters)
  if (baseUsername.length < 3) {
    baseUsername = baseUsername.padEnd(3, '0'); // Pad with zeros if too short
  }
  
  let username = baseUsername;
  let counter = 1;
  
  // Check if username exists and increment counter if needed
  while (await this.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

// Instance method to get public profile
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    profileImage: this.profileImage,
    isPremium: this.isPremium,
    createdAt: this.createdAt
  };
};

// Instance method to get private profile (for owner)
userSchema.methods.toPrivateJSON = function() {
  return {
    id: this._id,
    email: this.email,
    username: this.username,
    displayName: this.displayName,
    profileImage: this.profileImage,
    dateOfBirth: this.dateOfBirth,
    country: this.country,
    gender: this.gender,
    isVerified: this.isVerified,
    isPremium: this.isPremium,
    preferences: this.preferences,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema); 