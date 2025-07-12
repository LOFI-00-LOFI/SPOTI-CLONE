import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { localApi, Playlist, CreatePlaylistData } from '@/lib/localApi';
import { useToast } from './ToastContext';

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
      const combinedWithPublic = [...action.payload, ...state.userPlaylists];
      return {
        ...state,
        publicPlaylists: action.payload,
        playlists: combinedWithPublic,
        isLoading: false,
        error: null
      };
    
    case 'SET_USER_PLAYLISTS':
      const combinedWithUser = [...state.publicPlaylists, ...action.payload];
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
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await localApi.getPlaylists({ limit: 100 });
      dispatch({ type: 'SET_PUBLIC_PLAYLISTS', payload: response.playlists });
    } catch (error) {
      console.error('Failed to load playlists:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load playlists';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError('Failed to load playlists');
    }
  };

  // Load user's own playlists
  const loadMyPlaylists = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await localApi.getMyPlaylists({ limit: 100 });
      dispatch({ type: 'SET_USER_PLAYLISTS', payload: response.playlists });
    } catch (error) {
      console.error('Failed to load my playlists:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load my playlists';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError('Failed to load my playlists');
    }
  };

  // Create new playlist
  const createPlaylist = async (data: CreatePlaylistData, imageFile?: File): Promise<Playlist | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newPlaylist = await localApi.createPlaylist(data, imageFile) as Playlist;
      dispatch({ type: 'ADD_PLAYLIST', payload: newPlaylist });
      success('Playlist created successfully!');
      return newPlaylist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create playlist';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError('Failed to create playlist');
      return null;
    }
  };

  // Update playlist
  const updatePlaylist = async (id: string, data: Partial<CreatePlaylistData>, imageFile?: File) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedPlaylist = await localApi.updatePlaylist(id, data, imageFile) as Playlist;
      dispatch({ type: 'UPDATE_PLAYLIST', payload: updatedPlaylist });
      success('Playlist updated successfully!');
    } catch (error) {
      console.error('Failed to update playlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update playlist';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError('Failed to update playlist');
    }
  };

  // Delete playlist
  const deletePlaylist = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await localApi.deletePlaylist(id);
      dispatch({ type: 'DELETE_PLAYLIST', payload: id });
      success('Playlist deleted successfully!');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete playlist';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError('Failed to delete playlist');
    }
  };

  // Add track to playlist
  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const updatedPlaylist = await localApi.addTrackToPlaylist(playlistId, trackId) as Playlist;
      dispatch({ type: 'UPDATE_PLAYLIST', payload: updatedPlaylist });
      success('Track added to playlist!');
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      showError('Failed to add track to playlist');
    }
  };

  // Remove track from playlist
  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const updatedPlaylist = await localApi.removeTrackFromPlaylist(playlistId, trackId) as Playlist;
      dispatch({ type: 'UPDATE_PLAYLIST', payload: updatedPlaylist });
      success('Track removed from playlist!');
    } catch (error) {
      console.error('Failed to remove track from playlist:', error);
      showError('Failed to remove track from playlist');
    }
  };

  // Load single playlist by ID
  const loadPlaylistById = async (id: string) => {
    try {
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
      const playlist = await localApi.getPlaylistById(id);
      
      // Handle case where playlist was not found (deleted)
      if (playlist === null) {
        console.warn(`Playlist with ID ${id} not found (may have been deleted)`);
        dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: playlist });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Failed to load playlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load playlist';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError('Failed to load playlist');
    }
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