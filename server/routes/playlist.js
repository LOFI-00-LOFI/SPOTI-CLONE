const express = require('express');
const multer = require('multer');
const cloudinary = require('../cloudinary');
const Playlist = require('../models/Playlist');
const Audio = require('../models/Audio');
const User = require('../models/User');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Multer config for playlist cover images
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

// Create new playlist
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, description, backgroundColor, isPublic = true } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    let imageUrl = '';
    let publicId = '';

    // Upload image if provided
    if (req.file) {
      const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const imageResult = await cloudinary.uploader.upload(imageBase64, {
        resource_type: 'image',
        folder: 'spotify-clone/playlists',
        transformation: [
          { width: 500, height: 500, crop: 'fill', quality: 'auto' }
        ]
      });
      imageUrl = imageResult.secure_url;
      publicId = imageResult.public_id;
    }

    const newPlaylist = new Playlist({
      name: name.trim(),
      description: description ? description.trim() : '',
      image: imageUrl,
      public_id: publicId,
      backgroundColor: backgroundColor || '#333333',
      isPublic: isPublic === 'true' || isPublic === true,
      tracks: [],
      createdBy: req.user._id, // Assign to authenticated user
    });

    await newPlaylist.save();
    res.status(201).json(newPlaylist);
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all public playlists with pagination (visible to everyone)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = { isPublic: true };
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    const playlists = await Playlist.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('tracks', 'title artist_name duration')
      .populate('createdBy', 'displayName');

    const total = await Playlist.countDocuments(query);
    
    res.json({
      playlists,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error('Get playlists error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's own playlists (both public and private)
router.get('/my/playlists', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = { createdBy: req.user._id };
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    const playlists = await Playlist.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('tracks', 'title artist_name duration')
      .populate('createdBy', 'displayName');

    const total = await Playlist.countDocuments(query);
    
    res.json({
      playlists,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error('Get user playlists error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single playlist by ID (with visibility checks)
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('tracks')
      .populate('createdBy', 'displayName');
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if user can view this playlist
    const token = req.headers.authorization?.split(' ')[1];
    let currentUserId = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        currentUserId = decoded.id;
      } catch (err) {
        // Token invalid, treat as unauthenticated
      }
    }

    // If playlist is private and user is not the owner, deny access
    if (!playlist.isPublic && (!currentUserId || currentUserId !== playlist.createdBy._id.toString())) {
      return res.status(403).json({ error: 'Access denied. This playlist is private.' });
    }
    
    res.json(playlist);
  } catch (err) {
    console.error('Get playlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update playlist metadata
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, description, backgroundColor, isPublic } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if user owns this playlist
    if (playlist.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own playlists' });
    }

    // Update basic fields
    if (name !== undefined) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (backgroundColor !== undefined) playlist.backgroundColor = backgroundColor;
    if (isPublic !== undefined) playlist.isPublic = isPublic === 'true' || isPublic === true;

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (playlist.public_id) {
        try {
          await cloudinary.uploader.destroy(playlist.public_id);
        } catch (error) {
          console.error('Error deleting old playlist image:', error);
        }
      }

      // Upload new image
      const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const imageResult = await cloudinary.uploader.upload(imageBase64, {
        resource_type: 'image',
        folder: 'spotify-clone/playlists',
        transformation: [
          { width: 500, height: 500, crop: 'fill', quality: 'auto' }
        ]
      });
      playlist.image = imageResult.secure_url;
      playlist.public_id = imageResult.public_id;
    }

    await playlist.save();
    
    // Return populated playlist
    const updatedPlaylist = await Playlist.findById(playlist._id)
      .populate('tracks')
      .populate('createdBy', 'displayName');
    
    res.json(updatedPlaylist);
  } catch (err) {
    console.error('Update playlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add track to playlist
router.post('/:id/tracks', authenticateToken, async (req, res) => {
  try {
    const { trackId } = req.body;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if user owns this playlist
    if (playlist.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only add tracks to your own playlists' });
    }

    const track = await Audio.findById(trackId);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Check if track is already in playlist
    if (playlist.tracks.includes(trackId)) {
      return res.status(400).json({ error: 'Track already in playlist' });
    }

    playlist.tracks.push(trackId);
    await playlist.save();

    // Return updated playlist with populated tracks
    const updatedPlaylist = await Playlist.findById(playlist._id)
      .populate('tracks')
      .populate('createdBy', 'displayName');
    
    res.json(updatedPlaylist);
  } catch (err) {
    console.error('Add track to playlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove track from playlist
router.delete('/:id/tracks/:trackId', authenticateToken, async (req, res) => {
  try {
    const { id: playlistId, trackId } = req.params;
    
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if user owns this playlist
    if (playlist.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only remove tracks from your own playlists' });
    }

    // Remove track from playlist
    playlist.tracks = playlist.tracks.filter(track => track.toString() !== trackId);
    await playlist.save();

    // Return updated playlist with populated tracks
    const updatedPlaylist = await Playlist.findById(playlist._id)
      .populate('tracks')
      .populate('createdBy', 'displayName');
    
    res.json(updatedPlaylist);
  } catch (err) {
    console.error('Remove track from playlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reorder tracks in playlist
router.put('/:id/tracks/reorder', authenticateToken, async (req, res) => {
  try {
    const { trackIds } = req.body;
    
    if (!Array.isArray(trackIds)) {
      return res.status(400).json({ error: 'trackIds must be an array' });
    }

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if user owns this playlist
    if (playlist.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only reorder tracks in your own playlists' });
    }

    // Verify all track IDs exist in the playlist
    const playlistTrackIds = playlist.tracks.map(id => id.toString());
    const validTrackIds = trackIds.filter(id => playlistTrackIds.includes(id.toString()));
    
    if (validTrackIds.length !== playlist.tracks.length) {
      return res.status(400).json({ error: 'Invalid track IDs provided' });
    }

    playlist.tracks = validTrackIds;
    await playlist.save();

    // Return updated playlist with populated tracks
    const updatedPlaylist = await Playlist.findById(playlist._id)
      .populate('tracks')
      .populate('createdBy', 'displayName');
    
    res.json(updatedPlaylist);
  } catch (err) {
    console.error('Reorder playlist tracks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete playlist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if user owns this playlist
    if (playlist.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own playlists' });
    }

    // Delete playlist image from cloudinary if exists
    if (playlist.public_id) {
      try {
        await cloudinary.uploader.destroy(playlist.public_id);
      } catch (error) {
        console.error('Error deleting playlist image:', error);
      }
    }

    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get featured playlists
router.get('/featured/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const playlists = await Playlist.find({ isPublic: true, trackCount: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('tracks', 'title artist_name duration image');
    
    res.json(playlists);
  } catch (err) {
    console.error('Get featured playlists error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Follow/Unfollow a playlist
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user._id;

    // Verify playlist exists and is public
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (!playlist.isPublic && playlist.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Cannot follow private playlist' });
    }

    const user = await User.findById(userId);
    const isFollowed = user.followedPlaylists.includes(playlistId);

    if (isFollowed) {
      // Unfollow the playlist
      user.followedPlaylists = user.followedPlaylists.filter(id => id.toString() !== playlistId);
      await user.save();
      
      res.json({ 
        message: 'Playlist unfollowed',
        isFollowed: false 
      });
    } else {
      // Follow the playlist
      user.followedPlaylists.push(playlistId);
      await user.save();
      
      res.json({ 
        message: 'Playlist followed',
        isFollowed: true 
      });
    }

  } catch (err) {
    console.error('Follow/unfollow playlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check if user follows a playlist
router.get('/:id/follow-status', authenticateToken, async (req, res) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const isFollowed = user.followedPlaylists.includes(playlistId);

    res.json({ isFollowed });

  } catch (err) {
    console.error('Check follow status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's followed playlists
router.get('/followed/all', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'followedPlaylists',
        populate: [
          { path: 'createdBy', select: 'displayName' },
          { path: 'tracks', select: 'title artist_name duration' }
        ],
        options: {
          skip: skip,
          limit: limit,
          sort: { createdAt: -1 }
        }
      });

    const totalFollowed = await User.findById(req.user._id).select('followedPlaylists');
    const total = totalFollowed.followedPlaylists.length;

    res.json({
      followedPlaylists: user.followedPlaylists,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (err) {
    console.error('Get followed playlists error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get playlist statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const playlistId = req.params.id;
    
    // Count how many users follow this playlist
    const followCount = await User.countDocuments({
      followedPlaylists: playlistId
    });

    const playlist = await Playlist.findById(playlistId).populate('tracks');
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({
      playlistId,
      followCount,
      trackCount: playlist.trackCount,
      totalDuration: playlist.totalDuration
    });

  } catch (err) {
    console.error('Get playlist stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 