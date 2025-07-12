import { Play, Plus } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { getTrackImage } from "@/hooks/useApi";
import { useState } from "react";
import AddToPlaylistModal from "./AddToPlaylistModal";

import { Track } from "@/types/track";

interface SongCardProps {
  track: Track;
  index: number;
  onHover?: (index: number) => void;
  onLeave?: () => void;
  onClick?: (track: Track, index: number) => void;
}

// Generate a consistent gradient based on track name
const getGradientFromName = (name: string): string => {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-purple-500', 
    'from-green-500 to-blue-500',
    'from-yellow-500 to-red-500',
    'from-pink-500 to-yellow-500',
    'from-indigo-500 to-purple-500',
    'from-red-500 to-pink-500',
    'from-teal-500 to-green-500',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const SongCard: React.FC<SongCardProps> = ({
  track,
  index,
  onHover,
  onLeave,
  onClick,
}) => {
  const { state } = useMusicPlayer();
  const { requireAuth } = useAuthPrompt();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(track, index);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(track, index);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const isCurrentTrack = state.currentTrack?.id === track.id;
  const trackImage = getTrackImage(track);
  const hasValidImage = trackImage && trackImage !== '/placeholder.svg' && !imageError;
  const gradientClass = getGradientFromName(track.name);

  return (
    <div
      className="group hover:bg-[#181818] rounded-lg p-4 transition-all duration-300 cursor-pointer hover:shadow-lg"
      onClick={handleClick}
      onMouseEnter={() => onHover?.(index)}
      onMouseLeave={onLeave}
    >
      <div className="relative mb-4">
        <div className="w-full aspect-square rounded-lg overflow-hidden relative shadow-lg">
          {/* Default gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <div className="text-white text-2xl font-bold opacity-90">
              {track.name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          {/* Image overlay */}
          {hasValidImage && (
            <img
              src={trackImage}
              alt={track.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>
        
        {/* Action buttons */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          {/* Add to playlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              requireAuth('playlist', () => {
                setShowAddToPlaylist(true);
              }, track.name);
            }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#000000b3] hover:bg-[#000000e6] backdrop-blur-sm rounded-full shadow-2xl h-8 w-8 inline-flex items-center justify-center transform hover:scale-110 transition-transform"
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
          
          {/* Play button */}
          <button
            onClick={handlePlayClick}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#1db954] hover:bg-[#1ed760] rounded-full shadow-2xl h-12 w-12 inline-flex items-center justify-center transform hover:scale-110 transition-transform"
          >
            <Play className="h-5 w-5 text-black fill-current ml-0.5" />
          </button>
        </div>
      </div>
      
      <div className="min-w-0">
        <h3
          className={`font-semibold mb-1 truncate text-base ${
            isCurrentTrack ? "text-[#1db954]" : "text-white"
          }`}
        >
          {track.name}
        </h3>
        <p className="text-[#a7a7a7] text-sm truncate hover:text-white transition-colors cursor-pointer">
          {track.artist_name}
        </p>
      </div>

      {/* Add to Playlist Modal */}
      {showAddToPlaylist && (
        <AddToPlaylistModal
          track={track}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}
    </div>
  );
};

export default SongCard;
