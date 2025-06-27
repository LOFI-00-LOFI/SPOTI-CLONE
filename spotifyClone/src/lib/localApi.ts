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

class LocalApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://spotapi-ten.vercel.app/api') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      console.log(`Making request to: ${this.baseUrl}${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} - ${response.statusText}`, errorText);
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
}

// Create singleton instance
export const localApi = new LocalApi(); 