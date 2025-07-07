const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const audioRoutes = require('./routes/audio');
const playlistRoutes = require('./routes/playlist');
const authRoutes = require('./routes/auth');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(morgan('dev'));

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/playlists', playlistRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
}); 