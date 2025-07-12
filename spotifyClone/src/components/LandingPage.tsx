import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Heart, Upload, List, Headphones } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <header className="relative z-10 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center">
              <Music className="h-6 w-6 text-black" />
            </div>
            <span className="text-2xl font-bold">Spotify Clone</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogin}
              className="text-white hover:text-[#1db954] font-semibold transition-colors"
            >
              Log in
            </button>
            <button
              onClick={handleSignup}
              className="bg-white text-black hover:bg-gray-200 font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              Sign up free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-8 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-[#1db954] to-[#1ed760] bg-clip-text text-transparent">
              Music for everyone.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Millions of songs. No credit card needed.
            </p>
            <button
              onClick={handleSignup}
              className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-lg px-12 py-4 rounded-full transition-all duration-200 hover:scale-105 shadow-2xl"
            >
              GET SPOTIFY FREE
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why choose Spotify Clone?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Play your music</h3>
              <p className="text-gray-400">
                Listen to millions of songs and podcasts for free.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Create playlists</h3>
              <p className="text-gray-400">
                Build your perfect playlist with songs you love.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Like what you hear</h3>
              <p className="text-gray-400">
                Save songs to your library and discover new music.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload your music</h3>
              <p className="text-gray-400">
                Share your own tracks and reach new audiences.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-3">High quality audio</h3>
              <p className="text-gray-400">
                Enjoy crystal clear sound quality on all devices.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Discover new music</h3>
              <p className="text-gray-400">
                Explore trending songs and find your next favorite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 px-8 py-20 bg-gradient-to-r from-[#1db954] to-[#1ed760]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-black mb-8 opacity-80">
            Join millions of people who use Spotify Clone to discover and enjoy music.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSignup}
              className="bg-black text-white hover:bg-gray-800 font-bold text-lg px-12 py-4 rounded-full transition-all duration-200 hover:scale-105"
            >
              GET STARTED FREE
            </button>
            <button
              onClick={handleLogin}
              className="border-2 border-black text-black hover:bg-black hover:text-white font-bold text-lg px-12 py-4 rounded-full transition-all duration-200"
            >
              LOG IN
            </button>
          </div>
        </div>
      </section>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1db954] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1ed760] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1db954] rounded-full opacity-5 blur-3xl"></div>
      </div>
    </div>
  );
};

export default LandingPage;