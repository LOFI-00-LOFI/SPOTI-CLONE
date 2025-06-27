const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist_name: { type: String, required: true },
  album_name: { type: String, default: 'Single' },
  duration: { type: Number, default: 0 }, // in seconds
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  image: { type: String, default: '' }, // album/track artwork
  genre: { type: String, default: 'Unknown' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Add index for search functionality
audioSchema.index({ title: 'text', artist_name: 'text', album_name: 'text' });

module.exports = mongoose.model('Audio', audioSchema); 