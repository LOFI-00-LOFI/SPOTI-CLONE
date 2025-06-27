import { useQuery } from '@tanstack/react-query';
import { localApi } from '@/lib/localApi';
import { useMemo } from 'react';

// Debounce helper
const useDebounce = (value: string, delay: number) => {
  return useMemo(() => {
    const timeoutId = setTimeout(() => value, delay);
    return () => clearTimeout(timeoutId);
  }, [value, delay]);
};

// Main hooks that the app uses (replaces useJamendoApi)
export const usePopularTracks = (limit: number = 20) => {
  return useQuery({
    queryKey: ['popularTracks', limit],
    queryFn: () => localApi.getTracks({ limit, order: 'popularity' }),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useFeaturedTracks = (limit: number = 20) => {
  return useQuery({
    queryKey: ['featuredTracks', limit],
    queryFn: () => localApi.getFeaturedTracks(limit),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useNewReleases = (limit: number = 20) => {
  return useQuery({
    queryKey: ['newReleases', limit],
    queryFn: () => localApi.getNewReleases(limit),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useSearchTracks = (query: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['searchTracks', query.trim()],
    queryFn: async () => {
      console.log('Searching for:', query.trim());
      const result = await localApi.searchTracks(query.trim(), 50);
      console.log('Search results:', result);
      return result;
    },
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
};

export const useTracksByGenre = (genre: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['tracksByGenre', genre, limit],
    queryFn: () => localApi.getTracksByGenre(genre, limit),
    enabled: !!genre,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useAllTracks = (params: {
  page?: number;
  limit?: number;
  order?: 'popularity' | 'likes' | 'title' | 'artist' | 'newest';
  search?: string;
  genre?: string;
} = {}) => {
  return useQuery({
    queryKey: ['allTracks', params],
    queryFn: () => localApi.getTracks(params),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};



export const useArtists = () => {
  return useQuery({
    queryKey: ['artists'],
    queryFn: () => ({ results: [] }), // Return empty array since we don't have artists
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Helper functions
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getTrackImage = (track: any): string => {
  return track.album_image || track.image || '/placeholder.svg';
}; 