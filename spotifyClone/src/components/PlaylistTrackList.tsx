import { Play, Pause, MoreHorizontal, Clock, X } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { usePlaylist } from "@/contexts/PlaylistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { formatDuration, getTrackImage } from "@/hooks/useApi";
import { useState } from "react";
import HeartButton from "./HeartButton";
import TrackContextMenu from "./TrackContextMenu";
import { Track } from "@/types/track";

interface PlaylistTrackListProps {
  tracks: Track[];
  playlistId: string;
  showHeader?: boolean;
  showAlbum?: boolean;
  showArtwork?: boolean;
}

const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({ 
  tracks, 
  playlistId,
  showHeader = true, 
  showAlbum = true,
  showArtwork = false,
}) => {
  const { state, playQueue, togglePlay } = useMusicPlayer();
  const { removeTrackFromPlaylist } = usePlaylist();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const [removingTrackId, setRemovingTrackId] = useState<string | null>(null);

  const handlePlayTrack = (track: Track, index: number) => {
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

  const handleRemoveTrack = async (trackId: string) => {
    setRemovingTrackId(trackId);
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
    } catch (error) {
      console.error('Failed to remove track from playlist:', error);
    } finally {
      setRemovingTrackId(null);
    }
  };

  const isCurrentTrack = (track: Track) => state.currentTrack?.id === track.id;
  const isPlaying = (track: Track) => isCurrentTrack(track) && state.isPlaying;

  // Dynamic grid columns based on what we're showing
  const getGridCols = () => {
    if (showAlbum) {
      return 'grid-cols-[16px_4fr_2fr_1fr_50px_32px]'; // # Title Album Duration Actions Remove
    } else {
      return 'grid-cols-[16px_5fr_1fr_50px_32px]'; // # Title Duration Actions Remove
    }
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className={`grid ${getGridCols()} gap-4 py-2 text-sm text-[#a7a7a7] border-b border-[#282828] mb-2`}>
          <div className="flex justify-center">#</div>
          <div>TITLE</div>
          {showAlbum && <div>ALBUM</div>}
          <div className="flex justify-center">
            <Clock className="h-4 w-4" />
          </div>
          <div></div>
          <div></div>
        </div>
      )}
      
      <div className="space-y-1">
        {tracks.map((track, index) => {
          const isRemoving = removingTrackId === track.id;
          
          return (
            <div
              key={track.id}
              className={`group w-full grid ${getGridCols()} gap-4 py-2 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
                isCurrentTrack(track) ? 'bg-[#1a1a1a]' : ''
              } ${isRemoving ? 'opacity-50' : ''}`}
              onClick={() => !isRemoving && handlePlayTrack(track, index)}
            >
              {/* Track Number / Play Button */}
              <div className="flex items-center justify-center text-[#a7a7a7] group-hover:text-white">
                <span className={`text-sm ${isCurrentTrack(track) ? 'text-[#1db954]' : ''} group-hover:hidden`}>
                  {isCurrentTrack(track) && state.isPlaying ? (
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-3 bg-[#1db954] animate-pulse"></div>
                      <div className="w-1 h-2 bg-[#1db954] animate-pulse delay-75"></div>
                      <div className="w-1 h-4 bg-[#1db954] animate-pulse delay-150"></div>
                    </div>
                  ) : (
                    index + 1
                  )}
                </span>
                <button
                  className="hidden group-hover:flex h-8 w-8 rounded-full bg-transparent hover:bg-white/10 text-white items-center justify-center"
                >
                  {isPlaying(track) ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Track Info */}
              <div className="flex items-center gap-3 min-w-0">
                {showArtwork && (
                  <div className="w-10 h-10 rounded overflow-hidden relative flex-shrink-0">
                    {/* Default gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <div className="text-white text-sm font-bold opacity-80">
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
                )}
                <div className="min-w-0">
                  <div className={`font-medium truncate ${isCurrentTrack(track) ? 'text-[#1db954]' : 'text-white'}`}>
                    {track.name}
                  </div>
                  <div className="text-sm text-[#a7a7a7] truncate">
                    {track.artist_name}
                  </div>
                </div>
              </div>

              {/* Album */}
              {showAlbum && (
                <div className="flex items-center text-sm text-[#a7a7a7] truncate">
                  {track.album_name}
                </div>
              )}

              {/* Duration */}
              <div className="flex items-center justify-center text-sm text-[#a7a7a7]">
                {formatDuration(track.duration)}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div onClick={(e) => e.stopPropagation()}>
                  <HeartButton 
                    track={track} 
                    size="sm" 
                    variant="ghost"
                  />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <TrackContextMenu track={track} />
                </div>
              </div>

              {/* Remove Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTrack(track.id);
                  }}
                  disabled={isRemoving}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 text-[#a7a7a7] hover:text-red-400 inline-flex items-center justify-center rounded hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove from this playlist"
                >
                  {isRemoving ? (
                    <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlaylistTrackList; 