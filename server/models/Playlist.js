const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  image: { type: String, default: '' }, // playlist cover image
  public_id: { type: String, default: '' }, // cloudinary public id for image
  tracks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Audio' 
  }],
  trackCount: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // in seconds
  isPublic: { type: Boolean, default: true },
  createdBy: { type: String, default: 'User' }, // In future, this can be user ID
  backgroundColor: { type: String, default: '' }, // hex color for default background
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Add index for search functionality
playlistSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to update trackCount and totalDuration
playlistSchema.pre('save', async function(next) {
  if (this.isModified('tracks')) {
    this.trackCount = this.tracks.length;
    
    // Calculate total duration by populating tracks
    if (this.tracks.length > 0) {
      const populatedPlaylist = await this.constructor.findById(this._id).populate('tracks');
      if (populatedPlaylist && populatedPlaylist.tracks) {
        this.totalDuration = populatedPlaylist.tracks.reduce((total, track) => {
          return total + (track.duration || 0);
        }, 0);
      }
    } else {
      this.totalDuration = 0;
    }
  }
  next();
});

module.exports = mongoose.model('Playlist', playlistSchema); 