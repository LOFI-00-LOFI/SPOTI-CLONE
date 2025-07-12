import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Track } from '@/types/track';
import { useLikedSongs } from '@/contexts/LikedSongsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthPrompt } from '@/contexts/AuthPromptContext';

interface HeartButtonProps {
  track: Track;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
  showTooltip?: boolean;
}

const HeartButton: React.FC<HeartButtonProps> = ({ 
  track, 
  size = 'md', 
  variant = 'ghost', 
  className = '', 
  showTooltip = true 
}) => {
  const { isLiked, toggleLike } = useLikedSongs();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const [isAnimating, setIsAnimating] = useState(false);
  const liked = isAuthenticated ? isLiked(track.id) : false;
  
  // Debug: Log when liked state changes
  console.log(`HeartButton for ${track.name}: liked=${liked}, authenticated=${isAuthenticated}`);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6';
      case 'lg':
        return 'h-10 w-10';
      default:
        return 'h-8 w-8';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const actualToggleLike = () => {
      setIsAnimating(true);
      toggleLike(track);
      
      // Reset animation after it completes
      setTimeout(() => setIsAnimating(false), 300);
    };
    
    if (isAuthenticated) {
      actualToggleLike();
    } else {
      requireAuth('like', actualToggleLike, track.name);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className={`
          ${getSizeClasses()} 
          transition-all duration-200 ease-in-out inline-flex items-center justify-center rounded
          ${liked 
            ? 'text-[#1db954] hover:text-[#1ed760]' 
            : 'text-[#a7a7a7] hover:text-white'
          }
          ${variant === 'ghost' ? 'hover:bg-[#2a2a2a]' : ''}
          ${isAnimating ? 'scale-110' : 'scale-100'}
          ${className}
        `}
        title={showTooltip ? (liked ? 'Remove from Liked Songs' : 'Save to Liked Songs') : undefined}
      >
        <Heart 
          className={`
            ${getIconSize()} 
            transition-all duration-200 ease-in-out
            ${liked ? 'fill-current' : ''}
            ${isAnimating ? 'animate-pulse' : ''}
          `} 
        />
      </button>
      
      {/* Ripple effect */}
      {isAnimating && (
        <div className={`
          absolute inset-0 rounded-full
          ${liked ? 'bg-[#1db954]' : 'bg-gray-400'}
          opacity-30 animate-ping
        `} />
      )}
    </div>
  );
};

export default HeartButton; 