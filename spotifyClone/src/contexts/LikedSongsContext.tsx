import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track } from '@/types/track';

const LIKED_SONGS_KEY = 'melody-tail-liked-songs';

export interface LikedSong extends Track {
  dateAdded: number; // timestamp
}

interface LikedSongsContextType {
  likedSongs: LikedSong[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  addToLiked: (track: Track) => void;
  removeFromLiked: (trackId: string) => void;
  clearLikedSongs: () => void;
  likedCount: number;
}

const LikedSongsContext = createContext<LikedSongsContextType | undefined>(undefined);

export const LikedSongsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);

  // Load liked songs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIKED_SONGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old format to new format with dateAdded
        const migratedSongs: LikedSong[] = parsed.map((song: any) => {
          if (!song.dateAdded) {
            // For existing songs without dateAdded, use current timestamp
            return { ...song, dateAdded: Date.now() };
          }
          return song;
        });
        setLikedSongs(migratedSongs);
        console.log('Loaded liked songs:', migratedSongs.length);
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
      setLikedSongs([]);
    }
  }, []);

  // Save to localStorage whenever liked songs change
  useEffect(() => {
    try {
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(likedSongs));
      console.log('Saved liked songs:', likedSongs.length);
    } catch (error) {
      console.error('Error saving liked songs:', error);
    }
  }, [likedSongs]);

  const isLiked = (trackId: string): boolean => {
    return likedSongs.some(song => song.id === trackId);
  };

  const toggleLike = (track: Track): void => {
    console.log('toggleLike called for:', track.name);
    setLikedSongs(current => {
      const isCurrentlyLiked = current.some(song => song.id === track.id);
      
      if (isCurrentlyLiked) {
        console.log('Removing from liked songs:', track.name);
        const newState = current.filter(song => song.id !== track.id);
        console.log('New liked songs count:', newState.length);
        return newState;
      } else {
        console.log('Adding to liked songs:', track.name);
        const likedSong: LikedSong = { ...track, dateAdded: Date.now() };
        const newState = [...current, likedSong];
        console.log('New liked songs count:', newState.length);
        return newState;
      }
    });
  };

  const addToLiked = (track: Track): void => {
    setLikedSongs(current => {
      const isAlreadyLiked = current.some(song => song.id === track.id);
      if (!isAlreadyLiked) {
        console.log('Adding to liked songs:', track.name);
        const likedSong: LikedSong = { ...track, dateAdded: Date.now() };
        return [...current, likedSong];
      }
      return current;
    });
  };

  const removeFromLiked = (trackId: string): void => {
    setLikedSongs(current => {
      const track = current.find(song => song.id === trackId);
      if (track) {
        console.log('Removing from liked songs:', track.name);
      }
      return current.filter(song => song.id !== trackId);
    });
  };

  const clearLikedSongs = (): void => {
    console.log('Clearing all liked songs');
    setLikedSongs([]);
  };

  const contextValue: LikedSongsContextType = {
    likedSongs,
    isLiked,
    toggleLike,
    addToLiked,
    removeFromLiked,
    clearLikedSongs,
    likedCount: likedSongs.length
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