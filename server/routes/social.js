const express = require('express');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Playlist = require('../models/Playlist');
const router = express.Router();

// Import auth middleware
const { authenticateToken } = require('./auth');

// Follow a user
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is trying to follow themselves
    if (userId === followerId.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: followerId,
      following: userId
    });

    await follow.save();

    res.json({ 
      message: 'Successfully followed user',
      following: userToFollow.toPublicJSON()
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unfollow a user
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId
    });

    if (!follow) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's followers
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username displayName profileImage isPremium')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Follow.countDocuments({ following: userId });

    res.json({
      followers: followers.map(f => f.follower),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's following
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const following = await Follow.find({ follower: userId })
      .populate('following', 'username displayName profileImage isPremium')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Follow.countDocuments({ follower: userId });

    res.json({
      following: following.map(f => f.following),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user is following another user
router.get('/following/:userId/check', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const isFollowing = await Follow.exists({
      follower: followerId,
      following: userId
    });

    res.json({ isFollowing: !!isFollowing });
  } catch (error) {
    console.error('Check following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's activity feed (following users' playlists)
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users the current user is following
    const following = await Follow.find({ follower: userId })
      .select('following');

    const followingIds = following.map(f => f.following);

    // Get recent playlists from followed users
    const playlists = await Playlist.find({
      createdBy: { $in: followingIds },
      isPublic: true
    })
      .populate('createdBy', 'username displayName profileImage')
      .populate('tracks', 'title artist_name duration image')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Playlist.countDocuments({
      createdBy: { $in: