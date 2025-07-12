import React from 'react';
import { createPortal } from 'react-dom';
import { X, Music, Upload, Plus, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthPromptProps {
  onClose: () => void;
  action: 'play' | 'upload' | 'playlist' | 'like' | 'download';
  trackName?: string;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({ onClose, action, trackName }) => {
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    // If useNavigate is not available, handle navigation differently
    navigate = (path: string) => {
      window.location.href = path;
    };
  }

  const getActionDetails = () => {
    switch (action) {
      case 'play':
        return {
          icon: <Music className="h-8 w-8 text-[#1db954]" />,
          title: `Play ${trackName ? `"${trackName}"` : 'music'}`,
          description: 'Sign up to play unlimited songs and discover new music.',
          primaryButton: 'Sign up free',
          secondaryButton: 'Log in'
        };
      case 'upload':
        return {
          icon: <Upload className="h-8 w-8 text-[#1db954]" />,
          title: 'Upload your music',
          description: 'Create an account to upload your tracks and share them with the world.',
          primaryButton: 'Sign up free',
          secondaryButton: 'Log in'
        };
      case 'playlist':
        return {
          icon: <Plus className="h-8 w-8 text-[#1db954]" />,
          title: 'Create playlists',
          description: 'Sign up to create and manage your own playlists.',
          primaryButton: 'Sign up free',
          secondaryButton: 'Log in'
        };
      case 'like':
        return {
          icon: <Heart className="h-8 w-8 text-[#1db954]" />,
          title: 'Like songs',
          description: 'Sign up to like songs and build your music collection.',
          primaryButton: 'Sign up free',
          secondaryButton: 'Log in'
        };
      case 'download':
        return {
          icon: <Music className="h-8 w-8 text-[#1db954]" />,
          title: 'Download music',
          description: 'Sign up to download your favorite tracks.',
          primaryButton: 'Sign up free',
          secondaryButton: 'Log in'
        };
      default:
        return {
          icon: <Music className="h-8 w-8 text-[#1db954]" />,
          title: 'Sign up to continue',
          description: 'Create an account to access all features.',
          primaryButton: 'Sign up free',
          secondaryButton: 'Log in'
        };
    }
  };

  const details = getActionDetails();

  const handleSignup = () => {
    navigate('/signup');
    onClose();
  };

  const handleLogin = () => {
    navigate('/login');
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 backdrop-blur-md z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#121212] border border-[#282828] rounded-2xl p-10 w-full max-w-lg shadow-2xl relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors hover:bg-[#282828] rounded-full p-2"
        >
          <X size={20} />
        </button>

        {/* Icon and title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {details.icon}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{details.title}</h2>
          <p className="text-[#a7a7a7] text-base leading-relaxed">
            {details.description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={handleSignup}
            className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-4 px-8 rounded-full transition-all duration-200 hover:scale-105 transform text-base"
          >
            {details.primaryButton}
          </button>
          
          <button
            onClick={handleLogin}
            className="w-full bg-transparent border-2 border-[#727272] text-white font-bold py-4 px-8 rounded-full hover:bg-[#727272] hover:border-[#727272] transition-all duration-200 text-base"
          >
            {details.secondaryButton}
          </button>
        </div>

        {/* Continue browsing link */}
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="text-[#a7a7a7] hover:text-white text-base underline transition-colors hover:no-underline"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthPrompt;