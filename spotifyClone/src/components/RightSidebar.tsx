
import { MoreHorizontal, Play } from "lucide-react";
import { getTrackImage, formatDuration } from "@/hooks/useApi";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import HeartButton from "./HeartButton";

const RightSidebar = () => {
  const { state, playTrack, dispatch } = useMusicPlayer();

  return (
    <div className="w-80 bg-[#121212] text-white h-full flex flex-col rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
        <h2 className="text-white font-semibold mb-2">
          {state.currentTrack ? 'Now Playing' : 'Discover Music'}
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Currently Playing */}
        <div className="p-4">
        {state.currentTrack ? (
          <div className="relative mb-4">
            <div className="w-full aspect-square bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-400 rounded-lg relative overflow-hidden">
              {state.currentTrack.album_image || state.currentTrack.image ? (
                <img
                  src={getTrackImage(state.currentTrack)}
                  alt={state.currentTrack.album_name}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-xl mb-1 truncate">{state.currentTrack.name}</h3>
                <p className="text-gray-200 text-sm truncate">{state.currentTrack.artist_name}</p>
              </div>
              <button
                className="absolute top-4 right-4 text-gray-300 hover:text-white h-8 w-8 hover:bg-black hover:bg-opacity-20 inline-flex items-center justify-center rounded"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative mb-4">
            <div className="w-full aspect-square bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg relative overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No track playing</p>
              </div>
            </div>
          </div>
        )}

        {state.currentTrack && (
          <div className="flex items-center space-x-3 mb-6">
            <HeartButton 
              track={state.currentTrack} 
              size="md" 
              variant="ghost"
              className="hover:bg-[#1a1a1a]"
            />
            <button
              className="text-[#a7a7a7] hover:text-white h-8 w-8 hover:bg-[#1a1a1a] inline-flex items-center justify-center rounded"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Next in Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">
              {state.currentTrack ? 'Next in queue' : state.queue.length > 0 ? 'Random songs for you' : 'Next in queue'}
            </h3>
            <button 
              className="text-[#a7a7a7] hover:text-white text-sm h-auto p-0 hover:bg-transparent"
              onClick={() => {
                // Optional: Add functionality to view full queue
              }}
            >
              View all
            </button>
          </div>
          
          {state.queue.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-[#a7a7a7] text-sm">No songs in queue</div>
              <div className="text-[#a7a7a7] text-xs mt-1">Play a song to start your queue</div>
            </div>
          ) : (
            <div className="space-y-2">
              {state.queue
                .slice(
                  state.currentTrack ? state.currentIndex + 1 : 0, 
                  state.currentTrack ? state.currentIndex + 7 : 6
                ) // Show next 6 songs or first 6 if no current track
                .map((track, index) => (
                <div 
                  key={`${track.id}-${state.currentIndex + 1 + index}`} 
                  className="group flex items-center space-x-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-[#a7a7a7] text-sm flex-shrink-0">
                    {state.currentTrack ? index + 1 : index + 1}
                  </div>
                  <div 
                    className="relative w-12 h-12 rounded flex-shrink-0 overflow-hidden"
                    onClick={() => {
                      // Jump to this track in the queue
                      const targetIndex = state.currentTrack ? state.currentIndex + 1 + index : index;
                      dispatch({ type: 'SET_CURRENT_INDEX', payload: targetIndex });
                    }}
                  >
                    <div className="w-full h-full rounded overflow-hidden relative">
                      {/* Default gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
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
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                      <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      // Jump to this track in the queue
                      const targetIndex = state.currentTrack ? state.currentIndex + 1 + index : index;
                      dispatch({ type: 'SET_CURRENT_INDEX', payload: targetIndex });
                    }}
                  >
                    <p className="text-white text-sm font-medium truncate">{track.name}</p>
                    <p className="text-[#a7a7a7] text-xs truncate">{track.artist_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HeartButton 
                        track={track} 
                        size="sm" 
                        variant="ghost"
                      />
                    </div>
                    <div className="text-[#a7a7a7] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatDuration(track.duration)}
                    </div>
                  </div>
                </div>
              ))}
              
              {state.queue.length > (state.currentTrack ? state.currentIndex + 7 : 6) && (
                <div className="text-center pt-2">
                  <div className="text-[#a7a7a7] text-xs">
                    + {state.queue.length - (state.currentTrack ? state.currentIndex + 7 : 6)} more songs in queue
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default RightSidebar;
