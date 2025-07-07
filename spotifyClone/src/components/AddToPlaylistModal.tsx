import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Plus, Music, CheckCircle } from 'lucide-react';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { Track } from '@/types/track';
import { LikedSong } from '@/contexts/LikedSongsContext';
import CreatePlaylistModal from './CreatePlaylistModal';

interface AddToPlaylistModalProps {
  track: Track | LikedSong;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ track, onClose }) => {
  const { state, addTrackToPlaylist } = usePlaylist();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);

  // Filter playlists based on search query
  const filteredPlaylists = state.playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Handle adding track to playlist
  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingToPlaylist(playlistId);
    try {
      await addTrackToPlaylist(playlistId, track.id);
      // Small delay to show success state
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      setAddingToPlaylist(null);
    }
  };

  // Check if track is already in playlist
  const isTrackInPlaylist = (playlistId: string) => {
    const playlist = state.playlists.find(p => p._id === playlistId);
    return playlist?.tracks.some(t => t._id === track.id) ?? false;
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-sm z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-playlist-title"
    >
      <div 
        className="bg-[#282828] rounded-lg w-full max-w-sm max-h-[70vh] overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#404040]">
          <h2 id="add-to-playlist-title" className="text-lg font-semibold text-white">
            Add to playlist
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-[#404040]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#404040]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a playlist"
              className="w-full pl-10 pr-3 py-2 bg-[#3e3e3e] border border-[#404040] rounded-md text-white placeholder-gray-400 focus:border-[#1db954] focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Create New Playlist */}
        <div className="p-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center gap-3 p-3 text-white hover:bg-[#404040] rounded-md transition-colors"
          >
            <div className="w-12 h-12 bg-[#404040] rounded flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Create playlist</div>
              <div className="text-sm text-gray-400">Make a new playlist with this song</div>
            </div>
          </button>
        </div>

        {/* Playlists List */}
        <div className="overflow-y-auto max-h-64">
          {filteredPlaylists.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              {searchQuery ? 'No playlists found' : 'No playlists yet'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredPlaylists.map((playlist) => {
                const isAdding = addingToPlaylist === playlist._id;
                const isInPlaylist = isTrackInPlaylist(playlist._id);
                
                return (
                  <button
                    key={playlist._id}
                    onClick={() => !isInPlaylist && !isAdding && handleAddToPlaylist(playlist._id)}
                    disabled={isInPlaylist || isAdding}
                    className={`w-full flex items-center gap-3 p-3 rounded-md transition-colors ${
                      isInPlaylist 
                        ? 'bg-[#1db954]/20 cursor-default' 
                        : isAdding 
                          ? 'bg-[#404040] cursor-not-allowed' 
                          : 'hover:bg-[#404040] cursor-pointer'
                    }`}
                  >
                    {/* Playlist Image */}
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      {playlist.image ? (
                        <img 
                          src={playlist.image} 
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: playlist.backgroundColor }}
                        >
                          <Music className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Playlist Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className={`font-medium truncate ${
                        isInPlaylist ? 'text-[#1db954]' : 'text-white'
                      }`}>
                        {playlist.name}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {playlist.trackCount} song{playlist.trackCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {isInPlaylist ? (
                        <CheckCircle className="h-5 w-5 text-[#1db954]" />
                      ) : isAdding ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Track Info Footer */}
        <div className="p-4 border-t border-[#404040] bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <div className="text-white text-sm font-bold">
                  {track.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{track.name}</div>
              <div className="text-gray-400 text-xs truncate">{track.artist_name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <CreatePlaylistModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (newPlaylist) => {
            // Add the track to the newly created playlist
            if (newPlaylist) {
              await handleAddToPlaylist(newPlaylist._id);
            }
            setShowCreateModal(false);
          }}
        />
      )}
    </div>,
    document.body
  );
};

export default AddToPlaylistModal; 