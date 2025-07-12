import { Track } from "@/types/track";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import SongCard from "./SongCard";

interface SongCardGridProps {
  tracks: Track[];
  onCardHover?: (index: number) => void;
  onCardLeave?: () => void;
  columns?: 'auto' | 2 | 3 | 4 | 5 | 6;
}

const SongCardGrid: React.FC<SongCardGridProps> = ({ 
  tracks, 
  onCardHover, 
  onCardLeave,
  columns = 'auto'
}) => {
  const { playQueue, togglePlay, state } = useMusicPlayer();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();

  const handleTrackClick = (track: Track, index: number) => {
    if (state.currentTrack?.id === track.id) {
      // If trying to play (not pause), require authentication
      if (!state.isPlaying && !isAuthenticated) {
        requireAuth('play', () => togglePlay(), track.name);
      } else {
        togglePlay();
      }
    } else {
      // Playing a new track - require authentication
      if (!isAuthenticated) {
        requireAuth('play', () => playQueue(tracks, index), track.name);
      } else {
        playQueue(tracks, index);
      }
    }
  };

  const getGridClasses = () => {
    if (columns === 'auto') {
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
    }
    
    const columnClasses = {
      2: 'grid grid-cols-2 gap-4',
      3: 'grid grid-cols-2 sm:grid-cols-3 gap-4',
      4: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
      5: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',
      6: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
    };
    
    return columnClasses[columns];
  };

  return (
    <div className={getGridClasses()}>
      {tracks.map((track, index) => (
        <SongCard
          key={track.id}
          track={track}
          index={index}
          onHover={onCardHover}
          onLeave={onCardLeave}
          onClick={handleTrackClick}
        />
      ))}
    </div>
  );
};

export default SongCardGrid; 