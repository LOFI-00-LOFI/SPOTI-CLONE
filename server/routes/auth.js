const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};


// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName, dateOfBirth, gender } = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: 'Email, password, and display name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Generate unique username from email
    const username = await User.generateUsername(email);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      username,
      password,
      displayName: displayName.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || 'prefer-not-to-say'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update login stats
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: user.toPrivateJSON()
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ 
        error: 'Email/username and password are required' 
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update login stats
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: user.toPrivateJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toPrivateJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the authenticateToken middleware for use in other routes
router.authenticateToken = authenticateToken;

module.exports = router; 