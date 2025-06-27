import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { localApi } from '@/lib/localApi';

// Define track interface based on local API
interface LocalTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  artist_id: string;
  album_name: string;
  album_id: string;
  album_image: string;
  audio: string;
  audiodownload: string;
  prourl: string;
  shorturl: string;
  shareurl: string;
  waveform: string;
  image: string;
  audiodownload_allowed: boolean;
}

interface MusicPlayerState {
  currentTrack: LocalTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: LocalTrack[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'once' | 'forever';
}

type MusicPlayerAction =
  | { type: 'SET_TRACK'; payload: { track: LocalTrack; index: number } }
  | { type: 'SET_QUEUE'; payload: LocalTrack[] }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' };

const initialState: MusicPlayerState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  queue: [],
  currentIndex: 0,
  shuffle: false,
  repeat: 'none',
};

function musicPlayerReducer(state: MusicPlayerState, action: MusicPlayerAction): MusicPlayerState {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload.track,
        currentIndex: action.payload.index,
        currentTime: 0,
      };
    
    case 'SET_QUEUE':
      return {
        ...state,
        queue: action.payload,
        currentIndex: 0,
        currentTrack: action.payload[0] || null,
      };
    
    case 'PLAY':
      return { ...state, isPlaying: true };
    
    case 'PAUSE':
      return { ...state, isPlaying: false };
    
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    
    case 'TOGGLE_SHUFFLE':
      return { ...state, shuffle: !state.shuffle };
    
    case 'TOGGLE_REPEAT':
      const modes: ('none' | 'once' | 'forever')[] = ['none', 'once', 'forever'];
      const currentIndex = modes.indexOf(state.repeat);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...state, repeat: nextMode };
    
    default:
      return state;
  }
}

interface MusicPlayerContextType {
  state: MusicPlayerState;
  playTrack: (track: LocalTrack) => void;
  playQueue: (tracks: LocalTrack[], startIndex?: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  loadInitialRandomSongs: () => Promise<void>;
  loadMoreTracks: () => Promise<void>;
  audioRef: React.RefObject<HTMLAudioElement>;
  dispatch: React.Dispatch<MusicPlayerAction>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(musicPlayerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const repeatOnceTracker = useRef<string | null>(null); // Track which song has been repeated once

  // Load initial songs
  const loadInitialRandomSongs = async () => {
    try {
      const response = await localApi.getTracks({ order: 'newest', limit: 50, page: 1 });
      if (response.results?.length) {
        dispatch({ type: 'SET_QUEUE', payload: response.results });
      }
    } catch (error) {
      console.error('Failed to load songs:', error);
    }
  };

  // Load more tracks
  const loadMoreTracks = async () => {
    try {
      const response = await localApi.getTracks({ 
        order: 'newest', 
        limit: 50, 
        page: Math.floor(state.queue.length / 50) + 1 
      });
      if (response.results?.length) {
        dispatch({ type: 'SET_QUEUE', payload: [...state.queue, ...response.results] });
      }
    } catch (error) {
      console.error('Failed to load more tracks:', error);
    }
  };

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      dispatch({ type: 'SET_TIME', payload: audio.currentTime });
    };

    const handleDurationChange = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration || 0 });
    };

    const handleEnded = () => {
      const currentTrackId = state.currentTrack?.id;
      
      // Infinite repeat - same song forever
      if (state.repeat === 'forever') {
        audio.currentTime = 0;
        audio.play();
        return;
      }
      
      // Repeat once - play same song twice total then move to next
      if (state.repeat === 'once') {
        if (repeatOnceTracker.current !== currentTrackId) {
          // First time ending, play once more
          repeatOnceTracker.current = currentTrackId || null;
          audio.currentTime = 0;
          audio.play();
          return;
        } else {
          // Second time ending, go to next track
          repeatOnceTracker.current = null;
          // Continue to auto-play next track below
        }
      }
      
      // Auto-play next track (for repeat none, or after repeat once is done)
      if (state.queue.length === 0) return;

      let nextIndex;
      if (state.shuffle) {
        nextIndex = Math.floor(Math.random() * state.queue.length);
      } else {
        nextIndex = (state.currentIndex + 1) % state.queue.length;
      }

      const nextTrackData = state.queue[nextIndex];
      if (nextTrackData) {
        dispatch({ type: 'SET_TRACK', payload: { track: nextTrackData, index: nextIndex } });
        dispatch({ type: 'PLAY' }); // Always play next track when auto-playing
      }
    };

    const handlePlay = () => dispatch({ type: 'PLAY' });
    const handlePause = () => dispatch({ type: 'PAUSE' });

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  });

  // Update audio when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && state.currentTrack) {
      audio.src = state.currentTrack.audio;
      audio.volume = state.volume;
      audio.load();
    }
  }, [state.currentTrack?.id]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [state.isPlaying]);

  // Handle volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = state.volume;
    }
  }, [state.volume]);

  // Functions
  const playTrack = async (track: LocalTrack) => {
    // Find track in queue or add it
    let trackIndex = state.queue.findIndex(t => t.id === track.id);
    
    if (trackIndex === -1) {
      // Track not in queue, load more songs with this track
      try {
        const response = await localApi.getTracks({ order: 'newest', limit: 50, page: 1 });
        if (response.results?.length) {
          const newQueue = [track, ...response.results.filter(t => t.id !== track.id)];
          dispatch({ type: 'SET_QUEUE', payload: newQueue });
          trackIndex = 0;
        }
      } catch (error) {
        console.error('Failed to load queue:', error);
        // Just play the single track
        dispatch({ type: 'SET_QUEUE', payload: [track] });
        trackIndex = 0;
      }
    }

    dispatch({ type: 'SET_TRACK', payload: { track, index: trackIndex } });
    dispatch({ type: 'PLAY' });
  };

  const playQueue = (tracks: LocalTrack[], startIndex = 0) => {
    dispatch({ type: 'SET_QUEUE', payload: tracks });
    const track = tracks[startIndex];
    if (track) {
      dispatch({ type: 'SET_TRACK', payload: { track, index: startIndex } });
      dispatch({ type: 'PLAY' });
    }
  };

  const togglePlay = () => {
    if (state.isPlaying) {
      dispatch({ type: 'PAUSE' });
    } else {
      dispatch({ type: 'PLAY' });
    }
  };

  const nextTrack = () => {
    if (state.queue.length === 0) return;
    const audio = audioRef.current;
    if (!audio) return;

    // Reset repeat once tracker when manually changing tracks
    repeatOnceTracker.current = null;

    let nextIndex;
    if (state.shuffle) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIndex = (state.currentIndex + 1) % state.queue.length;
    }

    const nextTrackData = state.queue[nextIndex];
    if (nextTrackData) {
      const wasPlaying = state.isPlaying;
      
      // Set the track
      dispatch({ type: 'SET_TRACK', payload: { track: nextTrackData, index: nextIndex } });
      
      // If was playing, directly control audio
      if (wasPlaying) {
        dispatch({ type: 'PLAY' });
        // Also directly tell audio to play after it loads
        setTimeout(() => {
          audio.play().catch(console.error);
        }, 100);
      }
    }
  };

  const previousTrack = () => {
    if (state.queue.length === 0) return;
    const audio = audioRef.current;
    if (!audio) return;

    // If more than 3 seconds, restart current track
    if (state.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    // Reset repeat once tracker when manually changing tracks
    repeatOnceTracker.current = null;

    let prevIndex;
    if (state.shuffle) {
      prevIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      prevIndex = state.currentIndex === 0 ? state.queue.length - 1 : state.currentIndex - 1;
    }

    const prevTrackData = state.queue[prevIndex];
    if (prevTrackData) {
      const wasPlaying = state.isPlaying;
      
      // Set the track
      dispatch({ type: 'SET_TRACK', payload: { track: prevTrackData, index: prevIndex } });
      
      // If was playing, directly control audio
      if (wasPlaying) {
        dispatch({ type: 'PLAY' });
        // Also directly tell audio to play after it loads
        setTimeout(() => {
          audio.play().catch(console.error);
        }, 100);
      }
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      dispatch({ type: 'SET_TIME', payload: time });
    }
  };

  const setVolume = (volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: Math.max(0, Math.min(1, volume)) });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  };

  const toggleRepeat = () => {
    dispatch({ type: 'TOGGLE_REPEAT' });
  };

  const contextValue: MusicPlayerContextType = {
    state,
    playTrack,
    playQueue,
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    loadInitialRandomSongs,
    loadMoreTracks,
    audioRef,
    dispatch,
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}; 