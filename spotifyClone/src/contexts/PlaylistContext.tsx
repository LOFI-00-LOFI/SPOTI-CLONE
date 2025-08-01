import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Playlist, CreatePlaylistData } from '@/types/api';
import { useToast } from './ToastContext';
import { api } from '@/lib/api';

interface PlaylistState {
  playlists: Playlist[];
  publicPlaylists: Playlist[];
  userPlaylists: Playlist[];
  currentPlaylist: Playlist | null;
  isLoading: boolean;
  error: string | null;
}

type PlaylistAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'SET_PUBLIC_PLAYLISTS'; payload: Playlist[] }
  | { type: 'SET_USER_PLAYLISTS'; payload: Playlist[] }
  | { type: 'ADD_PLAYLIST'; payload: Playlist }
  | { type: 'UPDATE_PLAYLIST'; payload: Playlist }
  | { type: 'DELETE_PLAYLIST'; payload: string }
  | { type: 'SET_CURRENT_PLAYLIST'; payload: Playlist | null };

const initialState: PlaylistState = {
  playlists: [],
  publicPlaylists: [],
  userPlaylists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,
};

function playlistReducer(state: PlaylistState, action: PlaylistAction): PlaylistState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_PLAYLISTS':
      return { ...state, playlists: action.payload, isLoading: false, error: null };
    
    case 'SET_PUBLIC_PLAYLISTS':
      // Combine playlists, removing duplicates by _id
      const combinedWithPublic = [
        ...action.payload,
        ...state.userPlaylists.filter(userPlaylist => 
          !action.payload.some(publicPlaylist => publicPlaylist._id === userPlaylist._id)
        )
      ];
      return {
        ...state,
        publicPlaylists: action.payload,
        playlists: combinedWithPublic,
        isLoading: false,
        error: null
      };
    
    case 'SET_USER_PLAYLISTS':
      // Combine playlists, removing duplicates by _id
      const combinedWithUser = [
        ...state.publicPlaylists,
        ...action.payload.filter(userPlaylist => 
          !state.publicPlaylists.some(publicPlaylist => publicPlaylist._id === userPlaylist._id)
        )
      ];
      return {
        ...state,
        userPlaylists: action.payload,
        playlists: combinedWithUser,
        isLoading: false,
        error: null
      };
    
    case 'ADD_PLAYLIST':
      return { 
        ...state, 
        playlists: [action.payload, ...state.playlists],
        isLoading: false,
        error: null 
      };
    
    case 'UPDATE_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map(playlist =>
          playlist._id === action.payload._id ? action.payload : playlist
        ),
        currentPlaylist: state.currentPlaylist?._id === action.payload._id 
          ? action.payload 
          : state.currentPlaylist,
        isLoading: false,
        error: null
      };
    
    case 'DELETE_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.filter(playlist => playlist._id !== action.payload),
        currentPlaylist: state.currentPlaylist?._id === action.payload 
          ? null 
          : state.currentPlaylist,
        isLoading: false,
        error: null
      };
    
    case 'SET_CURRENT_PLAYLIST':
      return { ...state, currentPlaylist: action.payload };
    
    default:
      return state;
  }
}

interface PlaylistContextType {
  state: PlaylistState;
  loadPlaylists: () => Promise<void>;
  loadMyPlaylists: () => Promise<void>;
  createPlaylist: (data: CreatePlaylistData, imageFile?: File) => Promise<Playlist | null>;
  updatePlaylist: (id: string, data: Partial<CreatePlaylistData>, imageFile?: File) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  loadPlaylistById: (id: string) => Promise<void>;
  clearError: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(playlistReducer, initialState);
  const { success, error: showError } = useToast();

  // Load all public playlists
  const loadPlaylists = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await api.getPlaylists({ limit: 100 });
    
    if (response.error) {
      console.error('Failed to load playlists:', response.error);
      dispatch({ type: 'SET_ERROR', payload: response.error.message });
      showError('Failed to load playlists');
      return;
    }

    if (response.data) {
      dispatch({ type: 'SET_PUBLIC_PLAYLISTS', payload: response.data.playlists });
    }
  };

  // Load user's own playlists
  const loadMyPlaylists = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await api.getMyPlaylists({ limit: 100 });
    
    if (response.error) {
      console.error('Failed to load my playlists:', response.error);
      dispatch({ type: 'SET_ERROR', payload: response.error.message });
      showError('Failed to load my playlists');
      return;
    }

    if (response.data) {
      dispatch({ type: 'SET_USER_PLAYLISTS', payload: response.data.playlists });
    }
  };

  // Create new playlist
  const createPlaylist = async (data: CreatePlaylistData, imageFile?: File): Promise<Playlist | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await api.createPlaylist(data, imageFile);
    
    if (response.error) {
      console.error('Failed to create playlist:', response.error);
      dispatch({ type: 'SET_ERROR', payload: response.error.message });
      showError('Failed to create playlist');
      return null;
    }

    if (response.data) {
      dispatch({ type: 'ADD_PLAYLIST', payload: response.data });
      success('Playlist created successfully!');
      return response.data;
    }
    return null;
  };

  // Update playlist
  const updatePlaylist = async (id: string, data: Partial<CreatePlaylistData>, imageFile?: File) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await api.updatePlaylist(id, data, imageFile);
    
    if (response.error) {
      console.error('Failed to update playlist:', response.error);
      dispatch({ type: 'SET_ERROR', payload: response.error.message });
      showError('Failed to update playlist');
      return;
    }

    if (response.data) {
      dispatch({ type: 'UPDATE_PLAYLIST', payload: response.data });
      success('Playlist updated successfully!');
    }
  };

  // Delete playlist
  const deletePlaylist = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await api.deletePlaylist(id);
    
    if (response.error) {
      console.error('Failed to delete playlist:', response.error);
      dispatch({ type: 'SET_ERROR', payload: response.error.message });
      showError('Failed to delete playlist');
      return;
    }

    dispatch({ type: 'DELETE_PLAYLIST', payload: id });
    success('Playlist deleted successfully!');
  };

  // Add track to playlist
  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const response = await api.addTrackToPlaylist(playlistId, trackId);
    
    if (response.error) {
      console.error('Failed to add track to playlist:', response.error);
      showError('Failed to add track to playlist');
      return;
    }

    if (response.data) {
      dispatch({ type: 'UPDATE_PLAYLIST', payload: response.data });
      success('Track added to playlist!');
    }
  };

  // Remove track from playlist
  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const response = await api.removeTrackFromPlaylist(playlistId, trackId);
    
    if (response.error) {
      console.error('Failed to remove track from playlist:', response.error);
      showError('Failed to remove track from playlist');
      return;
    }

    if (response.data) {
      dispatch({ type: 'UPDATE_PLAYLIST', payload: response.data });
      success('Track removed from playlist!');
    }
  };

  // Load single playlist by ID
  const loadPlaylistById = async (id: string) => {
    // Check if playlist exists in current state before making API call
    const playlistExists = state.playlists.some(p => p._id === id);
    
    // If playlists are loaded but playlist doesn't exist, don't make API call
    if (state.playlists.length > 0 && !playlistExists) {
      console.warn(`Playlist with ID ${id} not found in current playlists, skipping API call`);
      dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await api.getPlaylistById(id);
    
    if (response.error) {
      console.error('Failed to load playlist:', response.error);
      dispatch({ type: 'SET_ERROR', payload: response.error.message });
      showError('Failed to load playlist');
      return;
    }

    if (response.data === null) {
      console.warn(`Playlist with ID ${id} not found (may have been deleted)`);
      dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: null });
    } else {
      dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: response.data });
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  const contextValue: PlaylistContextType = {
    state,
    loadPlaylists,
    loadMyPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    loadPlaylistById,
    clearError,
  };

  return (
    <PlaylistContext.Provider value={contextValue}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = (): PlaylistContextType => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}; 