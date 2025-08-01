import { LocalTrack, Playlist, CreatePlaylistData } from '@/types/api';
import { apiClient } from './apiClient';

interface PaginatedResponse<T> {
  results?: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface AudioResponse {
  headers: {
    status: string;
    code: number;
    results_count: number;
  };
  audios: LocalTrack[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface PlaylistResponse {
  playlists: Playlist[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const api = {
  // Audio endpoints
  getTracks: (params?: {
    page?: number;
    limit?: number;
    order?: 'title' | 'artist' | 'newest' | 'popularity';
    search?: string;
    genre?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiClient.get<AudioResponse>(`/audio?${queryParams}`);
  },

  getTrackById: (id: string) => apiClient.get<LocalTrack>(`/audio/${id}`),

  uploadTrack: (audioFile: File, imageFile: File | null, trackData: any) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    Object.entries(trackData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    return apiClient.post<LocalTrack>('/audio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadMultipleTracks: (audioFiles: File[], tracksData: any[]) => {
    const formData = new FormData();
    
    // Add all audio files
    audioFiles.forEach((file) => {
      formData.append('audio', file);
    });
    
    // Add metadata for each track with indexed keys
    tracksData.forEach((trackData, index) => {
      Object.entries(trackData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(`${key}_${index}`, value.toString());
        }
      });
    });

    interface UploadMultipleResponse {
      message: string;
      uploadedTracks: LocalTrack[];
      errors?: { filename: string; error: string }[];
    }

    return apiClient.post<UploadMultipleResponse>('/audio/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteTrack: (id: string) => apiClient.delete(`/audio/${id}`),

  // Playlist endpoints
  getPlaylists: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiClient.get<PlaylistResponse>(`/playlists?${queryParams}`);
  },

  getMyPlaylists: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiClient.get<PlaylistResponse>(`/playlists/my/playlists?${queryParams}`);
  },

  getPlaylistById: (id: string) => apiClient.get<Playlist>(`/playlists/${id}`),

  createPlaylist: (playlistData: CreatePlaylistData, imageFile?: File) => {
    const formData = new FormData();
    Object.entries(playlistData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return apiClient.post<Playlist>('/playlists', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updatePlaylist: (id: string, playlistData: Partial<CreatePlaylistData>, imageFile?: File) => {
    const formData = new FormData();
    Object.entries(playlistData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return apiClient.put<Playlist>(`/playlists/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePlaylist: (id: string) => apiClient.delete(`/playlists/${id}`),

  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    apiClient.post<Playlist>(`/playlists/${playlistId}/tracks`, { trackId }),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    apiClient.delete<Playlist>(`/playlists/${playlistId}/tracks/${trackId}`),

  // Like/Unlike tracks
  likeTrack: (trackId: string) => apiClient.post<{ isLiked: boolean }>(`/audio/${trackId}/like`),

  getLikeStatus: (trackId: string) => apiClient.get<{ isLiked: boolean }>(`/audio/${trackId}/like-status`),

  getLikedSongs: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiClient.get<{ likedSongs: LocalTrack[]; pagination: any }>(`/audio/liked/songs?${queryParams}`);
  },
}; 