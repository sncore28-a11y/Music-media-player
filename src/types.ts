export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  url: string;
  format: string;
  size: number; // in bytes
  fileName: string;
  isDemo?: boolean;
  dateAdded: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'off';

export interface PlayerStats {
  tracksCount: number;
  totalDuration: number;
}
