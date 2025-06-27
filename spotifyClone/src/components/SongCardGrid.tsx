import { Track } from "@/types/track";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
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

  const handleTrackClick = (track: Track, index: number) => {
    if (state.currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playQueue(tracks, index);
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