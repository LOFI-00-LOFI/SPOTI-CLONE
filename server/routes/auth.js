const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const cloudinary = require('../cloudinary');
const User = require('../models/User');
const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Multer config for profile images
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

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
    const username = displayName[0].toUpperCase();

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

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, dateOfBirth, gender } = req.body;
    const user = req.user;

    // Update fields if provided
    if (displayName !== undefined) {
      if (!displayName.trim()) {
        return res.status(400).json({ error: 'Display name cannot be empty' });
      }
      user.displayName = displayName.trim();
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    }

    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender value' });
      }
      user.gender = gender;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toPrivateJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = req.user;

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile image
router.post('/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const user = req.user;

    // Delete old profile image if exists
    if (user.profileImage) {
      // Extract public_id from cloudinary URL to delete it
      const urlParts = user.profileImage.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `spotify-clone/profiles/${filename.split('.')[0]}`;
      
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting old profile image:', error);
      }
    }

    // Upload new image
    const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const imageResult = await cloudinary.uploader.upload(imageBase64, {
      resource_type: 'image',
      folder: 'spotify-clone/profiles',
      transformation: [
        { width: 300, height: 300, crop: 'fill', quality: 'auto' }
      ]
    });

    user.profileImage = imageResult.secure_url;
    await user.save();

    res.json({
      message: 'Profile image updated successfully',
      profileImage: user.profileImage,
      user: user.toPrivateJSON()
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove profile image
router.delete('/profile-image', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.profileImage) {
      // Delete from cloudinary
      const urlParts = user.profileImage.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `spotify-clone/profiles/${filename.split('.')[0]}`;
      
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting profile image from cloudinary:', error);
      }

      user.profileImage = '';
      await user.save();
    }

    res.json({
      message: 'Profile image removed successfully',
      user: user.toPrivateJSON()
    });

  } catch (error) {
    console.error('Remove profile image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      isActive: true,
      $or: [
        { displayName: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('displayName username profileImage isPremium createdAt')
    .limit(parseInt(limit))
    .sort({ displayName: 1 });

    res.json({ users });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (invalidate token - in a real app, you'd maintain a blacklist)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production app, you'd want to maintain a token blacklist
    // For now, we'll just return success and let the client handle token removal
    res.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the authenticateToken middleware for use in other routes
router.authenticateToken = authenticateToken;

module.exports = router; 