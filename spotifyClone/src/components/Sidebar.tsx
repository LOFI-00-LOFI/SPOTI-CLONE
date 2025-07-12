import { Heart, Music, Search, Plus, PlayCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useLikedSongs } from "@/contexts/LikedSongsContext";
import { usePlaylist } from "@/contexts/PlaylistContext";
import { useNavigation } from "@/pages/Index";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import CreatePlaylistModal from "./CreatePlaylistModal";

const Sidebar = () => {
  const { state } = useMusicPlayer();
  const { likedCount } = useLikedSongs();
  const { state: playlistState, loadMyPlaylists } = usePlaylist();
  const { setCurrentView } = useNavigation();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load user's playlists when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadMyPlaylists();
    }
  }, [isAuthenticated]); // Remove loadMyPlaylists dependency to prevent infinite loop

  const handleLikedSongsClick = () => {
    requireAuth('like', () => setCurrentView('liked-songs'));
  };

  const handleCreatePlaylistClick = () => {
    requireAuth('playlist', () => setShowCreateModal(true));
  };

  return (
    <div className="w-80 bg-[#121212] text-white h-full flex flex-col rounded-xl">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#a7a7a7] font-semibold">Your Library</h2>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between mb-4">
          <button className="h-8 w-8 text-[#a7a7a7] hover:text-white hover:bg-[#1a1a1a] inline-flex items-center justify-center rounded">
            <Search className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-[#a7a7a7] text-sm">Recents</span>
            <div className="flex flex-col space-y-1">
              <div className="w-3 h-0.5 bg-[#a7a7a7]"></div>
              <div className="w-3 h-0.5 bg-[#a7a7a7]"></div>
              <div className="w-3 h-0.5 bg-[#a7a7a7]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-2 overflow-y-auto">
        {/* Liked Songs */}
        <div
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
          onClick={handleLikedSongsClick}
        >
          <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center flex-shrink-0">
            <Heart className="h-6 w-6 text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Liked Songs</p>
            <p className="text-[#a7a7a7] text-xs truncate">
              Playlist • {isAuthenticated ? likedCount : 0} song{likedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Create Playlist Button */}
        <div className="mt-4 mb-4">
          <button
            onClick={handleCreatePlaylistClick}
            className="flex items-center space-x-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors w-full text-left"
          >
            <div className="w-12 h-12 rounded bg-[#282828] flex items-center justify-center flex-shrink-0 group-hover:bg-[#404040] transition-colors">
              <Plus className="h-6 w-6 text-[#a7a7a7] group-hover:text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Create Playlist</p>
              <p className="text-[#a7a7a7] text-xs">Build your perfect mix</p>
            </div>
          </button>
        </div>

        {/* User Playlists */}
        {isAuthenticated && playlistState.playlists.length > 0 ? (
          <div className="space-y-1">
            {playlistState.playlists.map((playlist) => (
              <div
                key={playlist._id}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
                onClick={() => {
                  setCurrentView('playlist', playlist._id);
                }}
              >
                <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {playlist.image ? (
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center rounded"
                      style={{ backgroundColor: playlist.backgroundColor }}
                    >
                      <Music className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{playlist.name}</p>
                  <p className="text-[#a7a7a7] text-xs truncate">
                    Playlist • {playlist.trackCount} song{playlist.trackCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : !isAuthenticated ? (
          <div className="mt-6 text-center py-8">
            <div className="text-[#a7a7a7] text-sm mb-2">Create your first playlist</div>
            <p className="text-[#b3b3b3] text-xs">It's easy, we'll help you</p>
            <button
              onClick={handleCreatePlaylistClick}
              className="mt-4 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Create playlist
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center py-8">
            <div className="text-[#a7a7a7] text-sm mb-2">Create your first playlist</div>
            <p className="text-[#b3b3b3] text-xs">It's easy, we'll help you</p>
            <button
              onClick={handleCreatePlaylistClick}
              className="mt-4 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Create playlist
            </button>
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <CreatePlaylistModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(playlist) => {
            // Playlist context will automatically update the list
            console.log('Playlist created successfully!', playlist);
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
