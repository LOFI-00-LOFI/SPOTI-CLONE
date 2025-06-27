const express = require('express');
const multer = require('multer');
const cloudinary = require('../cloudinary');
const Audio = require('../models/Audio');
const router = express.Router();

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Allow audio files (required)
    if (file.fieldname === 'audio' && file.mimetype.startsWith('audio/')) {
      cb(null, true);
    }
    // Allow image files (optional)
    else if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    }
    // Reject other file types
    else {
      if (file.fieldname === 'audio') {
        cb(new Error('Audio field must contain an audio file'), false);
      } else if (file.fieldname === 'image') {
        cb(new Error('Image field must contain an image file'), false);
      } else {
        cb(new Error('Invalid file field'), false);
      }
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio, we'll check image separately
  }
});

// Upload single audio with image support (existing endpoint)
router.post('/upload', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const audioFile = req.files.audio[0];
    const imageFile = req.files.image ? req.files.image[0] : null;

    // Additional validation for image file size (5MB limit)
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image file size must be less than 5MB' });
    }

    // Upload audio to Cloudinary
    const audioBase64 = `data:${audioFile.mimetype};base64,${audioFile.buffer.toString('base64')}`;
    const audioResult = await cloudinary.uploader.upload(audioBase64, {
      resource_type: 'video', // Cloudinary treats audio as 'video'
      folder: 'spotify-clone/audio',
    });

    // Upload image if provided
    let imageUrl = '';
    if (imageFile) {
      const imageBase64 = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
      const imageResult = await cloudinary.uploader.upload(imageBase64, {
        resource_type: 'image',
        folder: 'spotify-clone/images',
      });
      imageUrl = imageResult.secure_url;
    }

    // Better default values and validation
    const title = req.body.title?.trim() || 'Untitled Track';
    const artist_name = req.body.artist_name?.trim() || 'Unknown Artist';
    const album_name = req.body.album_name?.trim() || 'Single';
    const genre = req.body.genre?.trim() || 'Other';
    const description = req.body.description?.trim() || '';
    const duration = Math.max(0, parseFloat(req.body.duration) || 0);

    const newAudio = new Audio({
      title,
      artist_name,
      album_name,
      duration,
      url: audioResult.secure_url,
      public_id: audioResult.public_id,
      image: imageUrl,
      genre,
      description,
    });

    await newAudio.save();
    res.status(201).json(newAudio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload multiple audio files
router.post('/upload-multiple', upload.array('audio', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one audio file is required' });
    }

    const uploadedTracks = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const audioFile = req.files[i];
      
      try {
        // Get metadata for this specific file from form data
        const fileIndex = i;
        const title = req.body[`title_${fileIndex}`]?.trim() || 
                     audioFile.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').trim();
        const artist_name = req.body[`artist_name_${fileIndex}`]?.trim() || 'Unknown Artist';
        const album_name = req.body[`album_name_${fileIndex}`]?.trim() || 'Single';
        const genre = req.body[`genre_${fileIndex}`]?.trim() || 'Other';
        const description = req.body[`description_${fileIndex}`]?.trim() || '';
        const duration = Math.max(0, parseFloat(req.body[`duration_${fileIndex}`]) || 0);

        // Upload audio to Cloudinary
        const audioBase64 = `data:${audioFile.mimetype};base64,${audioFile.buffer.toString('base64')}`;
        const audioResult = await cloudinary.uploader.upload(audioBase64, {
          resource_type: 'video',
          folder: 'spotify-clone/audio',
        });

        // Create and save the audio record
        const newAudio = new Audio({
          title,
          artist_name,
          album_name,
          duration,
          url: audioResult.secure_url,
          public_id: audioResult.public_id,
          image: '', // No individual images in bulk upload
          genre,
          description,
        });

        await newAudio.save();
        uploadedTracks.push(newAudio);

      } catch (error) {
        console.error(`Error uploading file ${audioFile.originalname}:`, error);
        errors.push({
          filename: audioFile.originalname,
          error: error.message
        });
      }
    }

    // Return results
    if (uploadedTracks.length === 0) {
      return res.status(400).json({ 
        error: 'No files could be uploaded successfully',
        errors 
      });
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedTracks.length} out of ${req.files.length} files`,
      uploadedTracks,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all audios with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const order = req.query.order || 'createdAt';
    const search = req.query.search || '';
    const genre = req.query.genre || '';

    let query = {};
    
    // Search functionality - using regex for more flexible search
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      query.$or = [
        { title: searchRegex },
        { artist_name: searchRegex },
        { album_name: searchRegex },
        { genre: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Genre filter
    if (genre) {
      query.genre = new RegExp(genre, 'i');
    }

    let sortOptions = {};
    switch (order) {
      case 'title':
        sortOptions = { title: 1 };
        break;
      case 'artist':
        sortOptions = { artist_name: 1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const audios = await Audio.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip);

    const total = await Audio.countDocuments(query);
    
    res.json({
      audios,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get featured/popular tracks
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const audios = await Audio.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(audios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get new releases
router.get('/new-releases', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const audios = await Audio.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(audios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tracks by genre
router.get('/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const audios = await Audio.find({ 
      genre: new RegExp(genre, 'i') 
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(audios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single audio by ID
router.get('/:id', async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    res.json(audio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete audio
router.delete('/:id', async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ error: 'Not found' });

    await cloudinary.uploader.destroy(audio.public_id, { resource_type: 'video' });
    await Audio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 