import { useQuery } from '@tanstack/react-query';
import { Track } from '@/types/track';
import { LocalTrack } from '@/types/api';
import { api } from '@/lib/api';

// Helper function to get track image
export const getTrackImage = (track: Track | LocalTrack): string => {
  if ('album_image' in track) {
    return track.album_image;
  }
  return track.image || '/placeholder.svg';
};

// Format duration in seconds to MM:SS
export const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface ApiResponse<T> {
  headers: {
    status: string;
    code: number;
    results_count: number;
  };
  audios: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Get popular tracks
export const usePopularTracks = (limit: number = 20) => {
  return useQuery({
    queryKey: ['popularTracks', limit],
    queryFn: async () => {
      const response = await api.getTracks({ limit, order: 'popularity' });
      if (response.error) throw response.error;
      return response.data || { audios: [] };
    },
  });
};

// Get featured tracks
export const useFeaturedTracks = (limit: number = 20) => {
  return useQuery({
    queryKey: ['featuredTracks', limit],
    queryFn: async () => {
      const response = await api.getTracks({ limit, order: 'newest' });
      if (response.error) throw response.error;
      return response.data || { audios: [] };
    },
  });
};

// Get new releases
export const useNewReleases = (limit: number = 20) => {
  return useQuery({
    queryKey: ['newReleases', limit],
    queryFn: async () => {
      const response = await api.getTracks({ limit, order: 'newest' });
      if (response.error) throw response.error;
      return response.data || { audios: [] };
    },
  });
};

// Search tracks
export const useSearchTracks = (query: string) => {
  return useQuery({
    queryKey: ['searchTracks', query],
    queryFn: async () => {
      if (!query.trim()) return { audios: [] };
      const response = await api.getTracks({ search: query.trim(), limit: 50 });
      if (response.error) throw response.error;
      return response.data || { audios: [] };
    },
    enabled: !!query.trim(),
  });
};

// Get tracks by genre
export const useTracksByGenre = (genre: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['tracksByGenre', genre, limit],
    queryFn: async () => {
      const response = await api.getTracks({ genre, limit });
      if (response.error) throw response.error;
      return response.data || { audios: [] };
    },
    enabled: !!genre,
  });
};

// Get tracks with pagination and filtering
export const useTracks = (params: {
  page?: number;
  limit?: number;
  order?: 'title' | 'artist' | 'newest' | 'popularity';
  search?: string;
  genre?: string;
}) => {
  return useQuery({
    queryKey: ['tracks', params],
    queryFn: async () => {
      const response = await api.getTracks(params);
      if (response.error) throw response.error;
      return response.data || { audios: [] };
    },
  });
}; 