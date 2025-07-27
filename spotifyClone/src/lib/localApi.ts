import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Local API for our custom audio upload server
export interface LocalTrack {
  _id: string;
  title: string;
  artist_name: string;
  album_name: string;
  duration: number;
  url: string;
  public_id: string;
  image: string;
  genre: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalApiResponse<T> {
  audios?: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface UploadTrackData {
  title: string;
  artist_name: string;
  album_name?: string;
  duration?: number;
  genre?: string;
  description?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description: string;
  image: string;
  public_id: string;
  tracks: LocalTrack[];
  trackCount: number;
  totalDuration: number;
  isPublic: boolean;
  createdBy: string | { _id: string; displayName: string };
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  backgroundColor?: string;
  isPublic?: boolean;
}

export interface PlaylistApiResponse<T> {
  playlists?: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

class LocalApi {
  private readonly axiosInstance: AxiosInstance;

  constructor(baseUrl: string = 'https://spotiapi-khaki.vercel.app/api') {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds timeout
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle common errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // For 404 errors on playlist endpoints, return null instead of throwing
        if (error.response?.status === 404 && error.config?.url?.includes('/playlists/')) {
          console.warn(`Playlist not found: ${error.config.url} - returning null`);
          return Promise.resolve({ data: null });
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      console.log(`Making ${method} request to: ${endpoint}`);
      
      let response: AxiosResponse<T>;
      
      switch (method) {
        case 'GET':
          response = await this.axiosInstance.get(endpoint, config);
          break;
        case 'POST':
          response = await this.axiosInstance.post(endpoint, data, config);
          break;
        case 'PUT':
          response = await this.axiosInstance.put(endpoint, data, config);
          break;
        case 'DELETE':
          response = await this.axiosInstance.delete(endpoint, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      console.log(`Response from ${endpoint}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Request failed for ${endpoint}:`, error);
      
      // If it's a 404 for playlist endpoints, return null
      if (error.response?.status === 404 && endpoint.includes('/playlists/')) {
        return null as T;
      }
      
      throw error;
    }
  }

  // Convert LocalTrack to Track format for frontend compatibility
  private convertToTrackFormat(track: LocalTrack) {
    return {
      id: track._id,
      name: track.title,
      duration: track.duration,
      artist_name: track.artist_name,
      artist_id: track._id,
      album_name: track.album_name,
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
    };
  }

  // Get tracks with pagination and filtering
  async getTracks(params: {
    page?: number;
    limit?: number;
    order?: 'title' | 'artist' | 'newest' | 'popularity';
    search?: string;
    genre?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest<LocalApiResponse<LocalTrack>>(
      'GET',
      `/audio?${queryParams}`
    );

    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: response.audios?.length || 0,
      },
      results: response.audios?.map(track => this.convertToTrackFormat(track)) || [],
      pagination: response.pagination,
    };
  }

  // Search tracks
  async searchTracks(query: string, limit: number = 20) {
    return this.getTracks({ search: query, limit });
  }

  // Get featured tracks
  async getFeaturedTracks(limit: number = 20) {
    const response = await this.makeRequest<LocalTrack[]>('GET', `/audio/featured?limit=${limit}`);
    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: response.length,
      },
      results: response.map(track => this.convertToTrackFormat(track)),
    };
  }

  // Get new releases
  async getNewReleases(limit: number = 20) {
    const response = await this.makeRequest<LocalTrack[]>('GET', `/audio/new-releases?limit=${limit}`);
    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: response.length,
      },
      results: response.map(track => this.convertToTrackFormat(track)),
    };
  }

  // Get tracks by genre
  async getTracksByGenre(genre: string, limit: number = 20) {
    const response = await this.makeRequest<LocalTrack[]>('GET', `/audio/genre/${genre}?limit=${limit}`);
    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: response.length,
      },
      results: response.map(track => this.convertToTrackFormat(track)),
    };
  }

  // Get single track
  async getTrackById(id: string) {
    const response = await this.makeRequest<LocalTrack>('GET', `/audio/${id}`);
    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: 1,
      },
      results: [this.convertToTrackFormat(response)],
    };
  }

  // Upload single track
  async uploadTrack(audioFile: File, imageFile: File | null, trackData: UploadTrackData) {
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

    return await this.makeRequest('POST', '/audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Upload multiple tracks
  async uploadMultipleTracks(audioFiles: File[], tracksData: UploadTrackData[]) {
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

    return await this.makeRequest('POST', '/audio/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Delete track
  async deleteTrack(trackId: string) {
    return this.makeRequest('DELETE', `/audio/${trackId}`);
  }

  // PLAYLIST METHODS

  // Create new playlist
  async createPlaylist(playlistData: CreatePlaylistData, imageFile?: File) {
    const formData = new FormData();
    
    Object.entries(playlistData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return await this.makeRequest('POST', '/playlists', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get all public playlists
  async getPlaylists(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest<PlaylistApiResponse<Playlist>>(
      'GET',
      `/playlists?${queryParams}`
    );

    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: response.playlists?.length || 0,
      },
      playlists: response.playlists || [],
      pagination: response.pagination,
    };
  }

  // Get user's own playlists (both public and private)
  async getMyPlaylists(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest<PlaylistApiResponse<Playlist>>(
      'GET',
      `/playlists/my/playlists?${queryParams}`
    );

    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: response.playlists?.length || 0,
      },
      playlists: response.playlists || [],
      pagination: response.pagination,
    };
  }

  // Get single playlist
  async getPlaylistById(id: string) {
    const response = await this.makeRequest<Playlist>('GET', `/playlists/${id}`);
    return response;
  }

  // Update playlist
  async updatePlaylist(id: string, playlistData: Partial<CreatePlaylistData>, imageFile?: File) {
    const formData = new FormData();
    
    Object.entries(playlistData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return await this.makeRequest('PUT', `/playlists/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Add track to playlist
  async addTrackToPlaylist(playlistId: string, trackId: string) {
    return this.makeRequest('POST', `/playlists/${playlistId}/tracks`, { trackId });
  }

  // Remove track from playlist
  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    return this.makeRequest('DELETE', `/playlists/${playlistId}/tracks/${trackId}`);
  }

  // Reorder tracks in playlist
  async reorderPlaylistTracks(playlistId: string, trackIds: string[]) {
    return this.makeRequest('PUT', `/playlists/${playlistId}/tracks/reorder`, { trackIds });
  }

  // Delete playlist
  async deletePlaylist(playlistId: string) {
    return this.makeRequest('DELETE', `/playlists/${playlistId}`);
  }

  // Get featured playlists
  async getFeaturedPlaylists(limit: number = 10) {
    const response = await this.makeRequest<Playlist[]>('GET', `/playlists/featured/all?limit=${limit}`);
    return {
      headers: {
        status: 'success',
        code: 200,
        results_count: response.length,
      },
      playlists: response,
    };
  }
}

// Create singleton instance
export const localApi = new LocalApi(); 