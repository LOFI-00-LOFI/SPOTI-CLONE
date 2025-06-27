import { useState, useRef, useEffect } from "react";
import { Music } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { getTrackImage, formatDuration } from "@/hooks/useApi";

const DraggableMiniPlayer = () => {
  const { state } = useMusicPlayer();
  const [position, setPosition] = useState({ 
    x: Math.max(window.innerWidth - 360, 20), 
    y: Math.max(window.innerHeight - 450, 20) 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(20, Math.min(window.innerWidth - 340, e.clientX - dragOffset.x));
        const newY = Math.max(20, Math.min(window.innerHeight - 450, e.clientY - dragOffset.y));
        
        setPosition({
          x: newX,
          y: newY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // Don't render if no track is playing
  if (!state.currentTrack) {
    return null;
  }

  return (
    <div
      ref={playerRef}
      className="fixed z-50 bg-[#121212] border border-[#2a2a2a] rounded-lg shadow-2xl backdrop-blur-sm"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-80">
        {/* Currently Playing */}
        <div className="flex items-center p-3 space-x-3">
          {/* Album Art */}
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            {state.currentTrack.album_image || state.currentTrack.image ? (
              <img
                src={getTrackImage(state.currentTrack)}
                alt={state.currentTrack.album_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-blue-600');
                  target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-5 w-5 text-white"><use href="#music-icon"></use></svg></div>';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Music className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-white text-sm font-medium truncate">{state.currentTrack.name}</p>
              {state.isPlaying && (
                <div className="w-2 h-2 bg-[#1db954] rounded-full animate-pulse flex-shrink-0"></div>
              )}
            </div>
            <p className="text-[#a7a7a7] text-xs truncate">{state.currentTrack.artist_name}</p>
          </div>
        </div>

        {/* Queue Section */}
        <div className="border-t border-[#2a2a2a] px-3 py-2 max-h-48 overflow-y-auto">
          <div className="text-[#a7a7a7] text-xs font-medium mb-2">Next in queue</div>
          {state.queue.length === 0 ? (
            <div className="text-[#a7a7a7] text-xs py-2">No songs in queue</div>
          ) : (
            <div className="space-y-2">
              {state.queue
                .slice(state.currentIndex + 1, state.currentIndex + 4) // Show next 3 songs
                .map((track, index) => (
                <div key={`${track.id}-${index}`} className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 relative">
                    {/* Default gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                      <div className="text-white text-xs font-bold opacity-80">
                        {track.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Image overlay */}
                    {getTrackImage(track) && getTrackImage(track) !== '/placeholder.svg' ? (
                      <img
                        src={getTrackImage(track)}
                        alt={track.album_name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{track.name}</p>
                    <p className="text-[#a7a7a7] text-xs truncate">{track.artist_name}</p>
                  </div>
                  <div className="text-[#a7a7a7] text-xs">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              ))}
              
              {state.queue.length > state.currentIndex + 4 && (
                <div className="text-center pt-1">
                  <div className="text-[#a7a7a7] text-xs">
                    + {state.queue.length - state.currentIndex - 4} more songs
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableMiniPlayer; 