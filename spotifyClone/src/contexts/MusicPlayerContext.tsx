import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { Track, BackendTrack, FrontendTrack } from '@/types/track';
import { LocalTrack } from '@/types/api';
import { api } from '@/lib/api';

interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'once' | 'forever';
  shuffledIndices: number[];
  shuffleIndex: number;
}

type MusicPlayerAction =
  | { type: 'SET_TRACK'; payload: { track: Track; index: number } }
  | { type: 'SET_QUEUE'; payload: Track[] }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'GENERATE_SHUFFLE_INDICES' }
  | { type: 'SET_SHUFFLE_INDEX'; payload: number };

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
  shuffledIndices: [],
  shuffleIndex: -1,
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
        shuffledIndices: [],
        shuffleIndex: -1,
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
      const newShuffle = !state.shuffle;
      if (newShuffle && state.queue.length > 0) {
        // Generate shuffled indices when turning shuffle on
        const indices = Array.from({ length: state.queue.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Find current track in shuffled array
        const shuffleIndex = indices.indexOf(state.currentIndex);
        
        return {
          ...state,
          shuffle: newShuffle,
          shuffledIndices: indices,
          shuffleIndex: shuffleIndex,
        };
      }
      return { ...state, shuffle: newShuffle };
    
    case 'TOGGLE_REPEAT':
      const modes: ('none' | 'once' | 'forever')[] = ['none', 'once', 'forever'];
      const currentIndex = modes.indexOf(state.repeat);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...state, repeat: nextMode };
    
    case 'GENERATE_SHUFFLE_INDICES':
      if (state.queue.length === 0) return state;
      
      // Generate shuffled indices using Fisher-Yates algorithm
      const indices = Array.from({ length: state.queue.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      return {
        ...state,
        shuffledIndices: indices,
        shuffleIndex: -1,
      };
    
    case 'SET_SHUFFLE_INDEX':
      return { ...state, shuffleIndex: action.payload };
    
    case 'SET_CURRENT_INDEX':
      const track = state.queue[action.payload];
      if (!track) return state;
      return {
        ...state,
        currentTrack: track,
        currentIndex: action.payload,
        isPlaying: true
      };
    
    default:
      return state;
  }
}

interface MusicPlayerContextType {
  state: MusicPlayerState;
  playTrack: (track: Track | LocalTrack) => void;
  playQueue: (tracks: (Track | LocalTrack)[], startIndex?: number, source?: 'liked-songs' | 'general') => void;
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

  // Type guards
  const isBackendTrack = (track: any): track is LocalTrack => {
    return '_id' in track && 'title' in track && !('audio' in track);
  };

  const isFrontendTrack = (track: any): track is Track => {
    return 'id' in track && 'name' in track && 'audio' in track;
  };

  // Convert backend track to frontend format
  const convertToFrontendTrack = (track: LocalTrack): Track => ({
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
  });

  // Get track ID based on track format
  const getTrackId = (track: Track | LocalTrack): string => {
    if (isBackendTrack(track)) {
      return track._id;
    }
    return track.id;
  };

  // Get track audio URL based on track format
  const getTrackAudio = (track: Track | LocalTrack): string => {
    if (isBackendTrack(track)) {
      return track.url;
    }
    return track.audio;
  };

  // Get track name based on format
  const getTrackName = (track: Track | LocalTrack): string => {
    if (isBackendTrack(track)) {
      return track.title;
    }
    return track.name;
  };

  // Load initial songs
  const loadInitialRandomSongs = async () => {
    try {
      const response = await api.getTracks({ order: 'newest', limit: 50, page: 1 });
      if (response.error) {
        console.error('Failed to load songs:', response.error);
        return;
      }
      if (response.data?.audios?.length) {
        const tracks = response.data.audios.map(convertToFrontendTrack);
        dispatch({ type: 'SET_QUEUE', payload: tracks });
        dispatch({ type: 'GENERATE_SHUFFLE_INDICES' });
      }
    } catch (error) {
      console.error('Failed to load songs:', error);
    }
  };

  // Load more tracks
  const loadMoreTracks = async () => {
    try {
      const response = await api.getTracks({ 
        order: 'newest', 
        limit: 50, 
        page: Math.floor(state.queue.length / 50) + 1 
      });
      if (response.error) {
        console.error('Failed to load more tracks:', response.error);
        return;
      }
      if (response.data?.audios?.length) {
        const tracks = response.data.audios.map(convertToFrontendTrack);
        dispatch({ type: 'SET_QUEUE', payload: [...state.queue, ...tracks] });
        dispatch({ type: 'GENERATE_SHUFFLE_INDICES' });
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
        const newShuffleIndex = (state.shuffleIndex + 1) % state.shuffledIndices.length;
        nextIndex = state.shuffledIndices[newShuffleIndex];
        dispatch({ type: 'SET_SHUFFLE_INDEX', payload: newShuffleIndex });
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
      try {
        // Get the audio URL from either format
        let audioUrl = getTrackAudio(state.currentTrack);
        console.log('Playing track:', {
          track: state.currentTrack,
          audioUrl,
          format: isBackendTrack(state.currentTrack) ? 'backend' : 'frontend',
          name: getTrackName(state.currentTrack),
          id: getTrackId(state.currentTrack)
        });

        // Ensure URL is valid and uses HTTPS
        if (!audioUrl) {
          console.error('No audio URL found for track:', state.currentTrack);
          throw new Error('No audio URL found');
        }

        const url = new URL(audioUrl);
        if (url.protocol === 'http:') {
          audioUrl = audioUrl.replace('http:', 'https:');
        }
        
        // Set audio source and properties
        audio.src = audioUrl;
        audio.crossOrigin = 'anonymous';
        audio.volume = state.volume;
        audio.load();

        // Add event listeners
        const handlePlay = () => {
          console.log('Audio play event fired');
          dispatch({ type: 'PLAY' });
        };
        const handlePause = () => {
          console.log('Audio pause event fired');
          dispatch({ type: 'PAUSE' });
        };
        const handleError = (e: ErrorEvent) => {
          console.error('Audio playback error:', e);
          console.error('Failed track:', {
            ...state.currentTrack,
            url: audioUrl,
            error: audio.error?.message || 'Unknown error'
          });
          // Try to automatically move to next track on error
          nextTrack();
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);

        // If was playing before track change, start playing new track
        if (state.isPlaying) {
          console.log('Attempting to play track:', audioUrl);
          audio.play().catch(error => {
            console.error('Play failed after track change:', error);
            dispatch({ type: 'PAUSE' });
          });
        }

        return () => {
          audio.removeEventListener('play', handlePlay);
          audio.removeEventListener('pause', handlePause);
          audio.removeEventListener('error', handleError);
        };
      } catch (error) {
        console.error('Track playback setup failed:', error);
        // Move to next track if URL is invalid
        nextTrack();
      }
    }
  }, [state.currentTrack && getTrackId(state.currentTrack)]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play failed:', error);
          // If autoplay fails, pause the player
          dispatch({ type: 'PAUSE' });
        });
      }
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
  // Play a single track
  const playTrack = async (track: Track | LocalTrack) => {
    // Convert track to frontend format if needed
    const frontendTrack = isBackendTrack(track) ? convertToFrontendTrack(track) : track;
    
    // Find track in queue or add it
    let trackIndex = state.queue.findIndex(t => getTrackId(t) === getTrackId(frontendTrack));
    
    if (trackIndex === -1) {
      // Track not in queue, load more songs with this track
      try {
        const response = await api.getTracks({ order: 'newest', limit: 50, page: 1 });
        if (response.error) {
          console.error('Failed to load queue:', response.error);
          // Just play the single track
          dispatch({ type: 'SET_QUEUE', payload: [frontendTrack] });
          dispatch({ type: 'GENERATE_SHUFFLE_INDICES' });
          trackIndex = 0;
          return;
        }
        if (response.data?.audios?.length) {
          const tracks = response.data.audios.map(convertToFrontendTrack);
          const newQueue = [frontendTrack, ...tracks.filter(t => getTrackId(t) !== getTrackId(frontendTrack))];
          dispatch({ type: 'SET_QUEUE', payload: newQueue });
          dispatch({ type: 'GENERATE_SHUFFLE_INDICES' });
          trackIndex = 0;
        }
      } catch (error) {
        console.error('Failed to load queue:', error);
        // Just play the single track
        dispatch({ type: 'SET_QUEUE', payload: [frontendTrack] });
        dispatch({ type: 'GENERATE_SHUFFLE_INDICES' });
        trackIndex = 0;
      }
    }

    dispatch({ type: 'SET_TRACK', payload: { track: frontendTrack, index: trackIndex } });
    
    // Update shuffle index if in shuffle mode
    if (state.shuffle && state.shuffledIndices.length > 0) {
      const shuffleIndex = state.shuffledIndices.indexOf(trackIndex);
      dispatch({ type: 'SET_SHUFFLE_INDEX', payload: shuffleIndex });
    }
    
    dispatch({ type: 'PLAY' });
  };

  // Play a queue of tracks
  const playQueue = (tracks: (Track | LocalTrack)[], startIndex = 0, source: 'liked-songs' | 'general' = 'general') => {
    if (!tracks || tracks.length === 0) {
      console.warn('Attempted to play empty queue');
      return;
    }

    // Log the incoming tracks
    console.log('PlayQueue received tracks:', JSON.stringify(tracks, null, 2));

    // Convert all tracks to frontend format
    const frontendTracks = tracks.map(track => isBackendTrack(track) ? convertToFrontendTrack(track) : track);

    // Validate tracks have required properties
    const validTracks = frontendTracks.filter(track => {
      try {
        const audioUrl = getTrackAudio(track);
        console.log('Track validation:', {
          track: track,
          audioUrl: audioUrl,
          isBackendTrack: isBackendTrack(track),
          isFrontendTrack: isFrontendTrack(track),
          hasUrl: 'url' in track,
          hasAudio: 'audio' in track
        });
        
        if (!audioUrl) {
          console.warn('Track missing audio URL:', track);
          return false;
        }
        return true;
      } catch (error) {
        console.warn('Invalid track:', track, error);
        return false;
      }
    });

    if (validTracks.length === 0) {
      console.warn('No valid tracks to play');
      return;
    }

    // Log the valid tracks
    console.log('Valid tracks for playback:', JSON.stringify(validTracks, null, 2));

    // Set the queue with valid tracks
    dispatch({ type: 'SET_QUEUE', payload: validTracks });
    dispatch({ type: 'GENERATE_SHUFFLE_INDICES' });

    // Ensure startIndex is within bounds
    const safeStartIndex = Math.min(Math.max(0, startIndex), validTracks.length - 1);
    const track = validTracks[safeStartIndex];

    if (track) {
      dispatch({ type: 'SET_TRACK', payload: { track, index: safeStartIndex } });
      
      // Update shuffle index if in shuffle mode
      if (state.shuffle && state.shuffledIndices.length > 0) {
        const shuffleIndex = state.shuffledIndices.indexOf(safeStartIndex);
        dispatch({ type: 'SET_SHUFFLE_INDEX', payload: shuffleIndex });
      }
      
      dispatch({ type: 'PLAY' });
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Toggle play failed:', error);
        dispatch({ type: 'PAUSE' });
      });
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
      const newShuffleIndex = (state.shuffleIndex + 1) % state.shuffledIndices.length;
      nextIndex = state.shuffledIndices[newShuffleIndex];
      dispatch({ type: 'SET_SHUFFLE_INDEX', payload: newShuffleIndex });
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
      const newShuffleIndex = state.shuffleIndex === 0 ? state.shuffledIndices.length - 1 : state.shuffleIndex - 1;
      prevIndex = state.shuffledIndices[newShuffleIndex];
      dispatch({ type: 'SET_SHUFFLE_INDEX', payload: newShuffleIndex });
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