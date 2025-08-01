import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track } from '@/types/track';
import { api } from '@/lib/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

export interface LikedSong extends Track {
  dateAdded: number; // timestamp
}

interface LikedSongsContextType {
  likedSongs: LikedSong[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => Promise<void>;
  addToLiked: (track: Track) => Promise<void>;
  removeFromLiked: (trackId: string) => Promise<void>;
  clearLikedSongs: () => void;
  likedCount: number;
  loadLikedSongs: () => Promise<void>;
}

const LikedSongsContext = createContext<LikedSongsContextType | undefined>(undefined);

export const LikedSongsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const { error: showError } = useToast();
  const { isAuthenticated } = useAuth();

  const loadLikedSongs = async () => {
    if (!isAuthenticated) {
      setLikedSongs([]);
      return;
    }

    try {
      const response = await api.getLikedSongs({ limit: 100 });
      if (response.error) {
        console.error('Failed to load liked songs:', response.error);
        showError('Failed to load liked songs');
        return;
      }

      if (response.data) {
        const likedSongs = response.data.likedSongs.map(track => ({
          id: track._id,
          name: track.title,
          artist_name: track.artist_name,
          artist_id: track._id,
          album_name: track.album_name || 'Single',
          album_id: track._id,
          album_image: track.image || '/placeholder-album.jpg',
          audio: track.url,
          audiodownload: track.url,
          prourl: '',
          shorturl: '',
          shareurl: '',
          waveform: '',
          image: track.image || '/placeholder-album.jpg',
          audiodownload_allowed: true,
          duration: track.duration,
          dateAdded: Date.now()
        }));
        setLikedSongs(likedSongs);
        console.log('Loaded liked songs:', likedSongs.length);
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
      showError('Failed to load liked songs');
    }
  };

  // Load liked songs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadLikedSongs();
    }
  }, [isAuthenticated]);

  const isLiked = (trackId: string): boolean => {
    return likedSongs.some(song => song.id === trackId);
  };

  const toggleLike = async (track: Track): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      const response = await api.likeTrack(track.id);
      if (response.error) {
        console.error('Failed to toggle like:', response.error);
        showError('Failed to toggle like');
        return;
      }

      if (response.data) {
        const { isLiked } = response.data;
        setLikedSongs(current => {
          if (isLiked) {
            const likedSong: LikedSong = { ...track, dateAdded: Date.now() };
            return [...current, likedSong];
          } else {
            return current.filter(song => song.id !== track.id);
          }
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showError('Failed to toggle like');
    }
  };

  const addToLiked = async (track: Track): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      const response = await api.likeTrack(track.id);
      if (response.error) {
        console.error('Failed to add to liked songs:', response.error);
        showError('Failed to add to liked songs');
        return;
      }

      if (response.data?.isLiked) {
        setLikedSongs(current => {
          const isAlreadyLiked = current.some(song => song.id === track.id);
          if (!isAlreadyLiked) {
            const likedSong: LikedSong = { ...track, dateAdded: Date.now() };
            return [...current, likedSong];
          }
          return current;
        });
      }
    } catch (error) {
      console.error('Error adding to liked songs:', error);
      showError('Failed to add to liked songs');
    }
  };

  const removeFromLiked = async (trackId: string): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      const response = await api.likeTrack(trackId); // This will unlike the track
      if (response.error) {
        console.error('Failed to remove from liked songs:', response.error);
        showError('Failed to remove from liked songs');
        return;
      }

      if (!response.data?.isLiked) {
        setLikedSongs(current => current.filter(song => song.id !== trackId));
      }
    } catch (error) {
      console.error('Error removing from liked songs:', error);
      showError('Failed to remove from liked songs');
    }
  };

  const clearLikedSongs = (): void => {
    setLikedSongs([]);
  };

  const contextValue: LikedSongsContextType = {
    likedSongs,
    isLiked,
    toggleLike,
    addToLiked,
    removeFromLiked,
    clearLikedSongs,
    likedCount: likedSongs.length,
    loadLikedSongs
  };

  return (
    <LikedSongsContext.Provider value={contextValue}>
      {children}
    </LikedSongsContext.Provider>
  );
};

export const useLikedSongs = (): LikedSongsContextType => {
  const context = useContext(LikedSongsContext);
  if (!context) {
    throw new Error('useLikedSongs must be used within a LikedSongsProvider');
  }
  return context;
}; 