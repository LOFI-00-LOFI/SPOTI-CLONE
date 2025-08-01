import { LocalTrack } from './api';

export interface Track {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  duration: number;
  audio: string;
  image: string;
  album_image?: string;
  audiodownload_allowed: boolean;
  // Optional frontend properties
  audiodownload?: string;
  prourl?: string;
  shorturl?: string;
  shareurl?: string;
  waveform?: string;
  // Optional backend properties
  _id?: string;
  title?: string;
  url?: string;
  public_id?: string;
  genre?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendTrack extends LocalTrack {}

export interface FrontendTrack extends Track {} 