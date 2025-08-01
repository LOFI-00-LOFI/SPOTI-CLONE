import { Heart, Play, Download, MoreHorizontal, List, Clock, Edit3, Trash2, Music, Shuffle } from "lucide-react";
import { usePlaylist } from "@/contexts/PlaylistContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { useState, useEffect, useRef } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import { Playlist, LocalTrack } from "@/types/api";
import PlaylistTrackList from "./PlaylistTrackList";
import { Track } from "@/types/track";

interface PlaylistPageProps {
  playlistId: string;
  searchQuery: string;
}

const PlaylistPage = ({ playlistId, searchQuery }: PlaylistPageProps) => {
  const { state, loadPlaylistById, removeTrackFromPlaylist, deletePlaylist } = usePlaylist();
  const { playQueue } = useMusicPlayer();
  const { isAuthenticated, user } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const { setCurrentView } = useNavigation();
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showTableHeaderBg, setShowTableHeaderBg] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the current playlist
  const playlist = state.playlists.find(p => p._id === playlistId) || state.currentPlaylist;
  
  // Check if current user is the playlist owner
  const isPlaylistOwner = playlist?.createdBy && typeof playlist.createdBy !== 'string' && 
    user && playlist.createdBy._id === user.id;

  // Load playlist if not found in state
  useEffect(() => {
    if (!playlist && playlistId && !state.isLoading) {
      // Check if this playlist exists in the playlists array
      const playlistExists = state.playlists.some(p => p._id === playlistId);
      
      // If we have loaded playlists but this one doesn't exist, it was likely deleted
      if (state.playlists.length > 0 && !playlistExists) {
        console.log(`Playlist ${playlistId} not found in playlists list, navigating to home`);
        setCurrentView('home');
        return;
      }
      
      // Only load if playlist exists in the list, or if we haven't loaded any playlists yet
      if (playlistExists || state.playlists.length === 0) {
        loadPlaylistById(playlistId);
      }
    }
  }, [playlistId, playlist, loadPlaylistById, state.isLoading, state.playlists, setCurrentView]);

  // Additional effect to handle when playlist gets deleted while viewing it
  useEffect(() => {
    if (playlist && playlistId && state.playlists.length > 0) {
      const stillExists = state.playlists.some(p => p._id === playlistId);
      if (!stillExists) {
        console.log(`Current playlist ${playlistId} was deleted, navigating to home`);
        setCurrentView('home');
      }
    }
  }, [playlist, playlistId, state.playlists, setCurrentView]);

  // Filter tracks based on search query
  const filteredBackendTracks = searchQuery.length > 0 
    ? playlist?.tracks.filter((track: any) => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : playlist?.tracks || [];

  // Convert filtered backend tracks to frontend format for display
  const filteredTracks: Track[] = filteredBackendTracks.map((track: any) => {
    return {
      id: track._id,
      name: track.title,
      duration: track.duration,
      artist_name: track.artist_name,
      artist_id: track._id,
      album_name: track.album_name || 'Single',
      album_id: track._id,
      album_image: track.image || '/placeholder-album.jpg',
      audio: track.url, // This is the audio URL from the backend
      audiodownload: track.url,
      prourl: '',
      shorturl: '',
      shareurl: '',
      waveform: '',
      image: track.image || '/placeholder-album.jpg',
      audiodownload_allowed: true,
    };
  });

  const handlePlayAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;

    // Convert backend tracks to frontend format
    const frontendTracks = playlist.tracks.map(track => ({
      id: track._id,
      name: track.title,
      artist_name: track.artist_name,
      album_name: track.album_name,
      duration: track.duration,
      audio: track.url,
      image: track.image || '/placeholder-album.jpg',
      album_image: track.image || '/placeholder-album.jpg',
      audiodownload_allowed: true,
      // Include backend properties
      _id: track._id,
      title: track.title,
      url: track.url,
      public_id: track.public_id,
      genre: track.genre,
      description: track.description,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt
    }));

    // Log the tracks we're trying to play
    console.log('Original playlist tracks (raw):', JSON.stringify(playlist.tracks, null, 2));
    console.log('First track details:', {
      url: frontendTracks[0]?.audio,
      name: frontendTracks[0]?.name,
      id: frontendTracks[0]?.id
    });

    if (!isAuthenticated) {
      requireAuth('play', () => playQueue(frontendTracks, 0, 'general'), frontendTracks[0]?.name);
    } else {
      playQueue(frontendTracks, 0, 'general');
    }
  };

  const handleShuffle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;

    // Convert backend tracks to frontend format
    const frontendTracks = playlist.tracks.map(track => ({
      id: track._id,
      name: track.title,
      artist_name: track.artist_name,
      album_name: track.album_name,
      duration: track.duration,
      audio: track.url,
      image: track.image || '/placeholder-album.jpg',
      album_image: track.image || '/placeholder-album.jpg',
      audiodownload_allowed: true,
      // Include backend properties
      _id: track._id,
      title: track.title,
      url: track.url,
      public_id: track.public_id,
      genre: track.genre,
      description: track.description,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt
    }));

    // Shuffle the tracks
    const shuffledTracks = [...frontendTracks];
    for (let i = shuffledTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTracks[i], shuffledTracks[j]] = [shuffledTracks[j], shuffledTracks[i]];
    }

    if (!isAuthenticated) {
      requireAuth('play', () => playQueue(shuffledTracks, 0, 'general'), shuffledTracks[0]?.name);
    } else {
      playQueue(shuffledTracks, 0, 'general');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (playlist) {
      await removeTrackFromPlaylist(playlist._id, trackId);
    }
  };

  const handleDeletePlaylist = async () => {
    if (playlist) {
      await deletePlaylist(playlist._id);
      setShowDeleteConfirm(false);
      // The playlist will be removed from state in the context
      // and the useEffect will handle navigation
    }
  };

  // Handle scroll to show/hide sticky header
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setShowStickyHeader(scrollTop > 300);
      setShowTableHeaderBg(scrollTop > 450);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Format duration for display
  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    } else {
      return `${minutes} min`;
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex-1 rounded-xl bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1db954] mx-auto mb-4"></div>
          <p className="text-[#a7a7a7]">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 rounded-xl bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <Music className="h-20 w-20 text-[#a7a7a7] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Playlist not found</h2>
          <p className="text-[#a7a7a7] text-lg">This playlist may have been deleted or moved.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 rounded-xl bg-gradient-to-b from-[#282828] via-[#28282884] via-10% to-[#12121200] text-white overflow-y-auto relative"
      style={{
        backgroundImage: playlist.backgroundColor 
          ? `linear-gradient(to bottom, ${playlist.backgroundColor}80, ${playlist.backgroundColor}40 10%, #12121200)`
          : undefined
      }}
    >
      {/* Sticky Header - shows on scroll */}
      {showStickyHeader && (
        <div 
          className="sticky top-0 z-20 px-8 py-4 transition-all duration-300"
          style={{
            background: playlist.backgroundColor 
              ? `linear-gradient(to right, ${playlist.backgroundColor}, ${playlist.backgroundColor}CC)`
              : 'linear-gradient(to right, #282828, #282828CC)'
          }}
        >
          <div className="flex items-center gap-6 max-w-full">
            <button
              onClick={handlePlayAll}
              disabled={filteredTracks.length === 0}
              className="bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black h-12 w-12 rounded-full transition-all duration-200 shadow-lg inline-flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </button>
            <h2 className="text-2xl font-bold text-white truncate">
              {searchQuery ? `Search in ${playlist.name}` : playlist.name}
            </h2>
          </div>
        </div>
      )}

      {/* Header Section with Dynamic Gradient */}
      <div 
        className="px-8 pt-16 pb-6"
        style={{
          background: playlist.backgroundColor 
            ? `linear-gradient(to bottom, ${playlist.backgroundColor}, ${playlist.backgroundColor}80)`
            : 'linear-gradient(to bottom, #404040, #40404080)'
        }}
      >
        <div className="flex items-end space-x-6">
          {/* Playlist Cover */}
          <div className="w-48 h-48 rounded-[8px] flex items-center justify-center flex-shrink-0 shadow-2xl overflow-hidden">
            {playlist.image ? (
              <img 
                src={playlist.image} 
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: playlist.backgroundColor || '#404040' }}
              >
                <Music className="h-20 w-20 text-white" />
              </div>
            )}
          </div>
          
          {/* Playlist Info */}
          <div className="flex-1 min-w-0 pb-4">
            <p className="text-sm font-bold mb-2 uppercase tracking-wide text-white">
              {playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}
            </p>
            <h1 className="text-[72px] font-black mb-4 leading-none text-white tracking-tight truncate">
              {searchQuery ? `Search in ${playlist.name}` : playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-[#b3b3b3] text-base mb-4 line-clamp-2">
                {playlist.description}
              </p>
            )}
            <div className="flex items-center text-sm text-white">
              <span className="font-semibold">
                {typeof playlist.createdBy === 'string'
                  ? playlist.createdBy
                  : playlist.createdBy?.displayName || 'Unknown'}
              </span>
              <span className="mx-2">•</span>
              <span className="font-normal">
                {searchQuery 
                  ? `${filteredTracks.length} of ${playlist.trackCount} songs` 
                  : `${playlist.trackCount} songs`
                }
              </span>
              {playlist.totalDuration > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-normal">
                    {formatDuration(playlist.totalDuration)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Play Button */}
            <button
              onClick={handlePlayAll}
              disabled={filteredTracks.length === 0}
              className="bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black h-14 w-14 rounded-full transition-all duration-200 shadow-lg inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-6 w-6 fill-current ml-1" />
            </button>

            {/* Shuffle Button */}
            <button
              onClick={handleShuffle}
              disabled={filteredTracks.length === 0}
              className="text-[#a7a7a7] hover:text-white h-8 w-8 hover:bg-[#ffffff10] inline-flex items-center justify-center rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle className="h-5 w-5" />
            </button>
            
            {/* Download Button */}
            <button
              className="text-[#a7a7a7] hover:text-white h-8 w-8 hover:bg-[#ffffff10] inline-flex items-center justify-center rounded"
            >
              <Download className="h-5 w-5" />
            </button>
            
            {/* More Options - Only show for playlist owner */}
            {isPlaylistOwner && (
              <div className="relative">
                <button
                  className="text-[#a7a7a7] hover:text-white h-8 w-8 hover:bg-[#ffffff10] inline-flex items-center justify-center rounded"
                  onClick={() => {
                    if (!isAuthenticated) {
                      requireAuth('playlist', () => setShowDeleteConfirm(true), `manage ${playlist?.name}`);
                    } else {
                      setShowDeleteConfirm(!showDeleteConfirm);
                    }
                  }}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {showDeleteConfirm && (
                  <div className="absolute top-10 left-0 bg-[#282828] border border-[#404040] rounded-md shadow-xl py-2 w-48 z-30">
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          requireAuth('playlist', () => {
                            // TODO: Implement edit functionality
                            console.log('Edit playlist functionality coming soon');
                          }, `edit ${playlist?.name}`);
                        } else {
                          // TODO: Implement edit functionality
                          console.log('Edit playlist functionality coming soon');
                        }
                        setShowDeleteConfirm(false);
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-[#404040] transition-colors flex items-center gap-3"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit details
                    </button>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          requireAuth('playlist', () => handleDeletePlaylist(), `delete ${playlist?.name}`);
                        } else {
                          handleDeletePlaylist();
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#404040] transition-colors flex items-center gap-3"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete playlist
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* List View Toggle */}
          <div className="flex items-center space-x-4">
            <button
              className="text-[#a7a7a7] hover:text-white text-sm font-medium h-8 px-3 hover:bg-[#ffffff10] inline-flex items-center justify-center gap-2 rounded"
            >
              List
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List Section */}
      <div className={`px-8 pb-8 ${showStickyHeader ? 'bg-[#121212]' : ''}`}>
        {filteredTracks.length > 0 ? (
          <div>
            {/* Playlist Track List with Remove Functionality */}
            <PlaylistTrackList 
              tracks={filteredTracks} 
              playlistId={playlist._id}
              showAlbum={true}
              showHeader={true}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            {searchQuery && playlist.tracks.length > 0 ? (
              // Show "No search results" when searching but no matches found
              <>
                <Music className="h-20 w-20 text-[#a7a7a7] mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">No results found</h2>
                <p className="text-[#a7a7a7] mb-8 text-lg">
                  Try searching for something else in this playlist.
                </p>
              </>
            ) : (
              // Show default empty state when no tracks in playlist
              <>
                <Music className="h-20 w-20 text-[#a7a7a7] mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Your playlist is empty</h2>
                <p className="text-[#a7a7a7] mb-8 text-lg">
                  Add songs to start building your perfect playlist.
                </p>
                <button
                  className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-3 rounded-full inline-flex items-center justify-center"
                  onClick={() => {
                    setCurrentView('home');
                  }}
                >
                  Find something to add
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistPage; 