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
  createdBy: string;
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
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:5000/api') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      console.log(`Making request to: ${this.baseUrl}${endpoint}`);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} - ${response.statusText}`, errorText);
        
        // For 404 errors on playlist endpoints, return null instead of throwing
        if (response.status === 404 && endpoint.includes('/playlists/')) {
          console.warn(`Playlist not found: ${endpoint} - returning null`);
          return null as T;
        }
        
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Response from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error);
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
    const response = await this.makeRequest<LocalTrack[]>(`/audio/featured?limit=${limit}`);
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
    const response = await this.makeRequest<LocalTrack[]>(`/audio/new-releases?limit=${limit}`);
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
    const response = await this.makeRequest<LocalTrack[]>(`/audio/genre/${genre}?limit=${limit}`);
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
    const response = await this.makeRequest<LocalTrack>(`/audio/${id}`);
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

    const response = await fetch(`${this.baseUrl}/audio/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
    }

    return response.json();
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

    const response = await fetch(`${this.baseUrl}/audio/upload-multiple`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Multiple upload failed: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // Delete track
  async deleteTrack(trackId: string) {
    return this.makeRequest(`/audio/${trackId}`, {
      method: 'DELETE',
    });
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

    const response = await fetch(`${this.baseUrl}/playlists`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Create playlist failed: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // Get all playlists
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

  // Get single playlist
  async getPlaylistById(id: string) {
    const response = await this.makeRequest<Playlist>(`/playlists/${id}`);
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

    const response = await fetch(`${this.baseUrl}/playlists/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Update playlist failed: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // Add track to playlist
  async addTrackToPlaylist(playlistId: string, trackId: string) {
    return this.makeRequest(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
  }

  // Remove track from playlist
  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    return this.makeRequest(`/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
  }

  // Reorder tracks in playlist
  async reorderPlaylistTracks(playlistId: string, trackIds: string[]) {
    return this.makeRequest(`/playlists/${playlistId}/tracks/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ trackIds }),
    });
  }

  // Delete playlist
  async deletePlaylist(playlistId: string) {
    return this.makeRequest(`/playlists/${playlistId}`, {
      method: 'DELETE',
    });
  }

  // Get featured playlists
  async getFeaturedPlaylists(limit: number = 10) {
    const response = await this.makeRequest<Playlist[]>(`/playlists/featured/all?limit=${limit}`);
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