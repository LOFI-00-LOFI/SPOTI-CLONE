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

export interface UploadTrackData {
  title: string;
  artist_name: string;
  album_name?: string;
  duration?: number;
  genre?: string;
  description?: string;
} 