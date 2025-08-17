export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  popularity: number;
  duration_ms: number;
  audioFeatures?: AudioFeatures;
  artistGenres?: string[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres?: string[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface PlaylistTrack {
  track: SpotifyTrack;
  added_at: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: SpotifyImage[];
  tracks: {
    items: PlaylistTrack[];
    total: number;
  };
}

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  duration_ms: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  tempo: number;
  valence: number;
  popularity?: number;
}

export interface CurrentPlayback {
  item: SpotifyTrack | null;
  is_playing: boolean;
}

export interface LastfmTrack {
  name: string;
  artist: {
    name: string;
  };
  playcount: string;
}

export interface PlaylistStats {
  totalTracks: number;
  avgPopularity: number;
  avgDuration: number;
  avgTempo: number;
  avgLoudness: number;
  totalScrobbles?: number;
}

export interface TrackWithStats extends PlaylistTrack {
  daysSinceAdded: number;
  scrobbles?: number;
}

export interface GenreData {
  genre: string;
  count: number;
}

export interface ArtistData {
  artist: string;
  count: number;
}

export interface DateData {
  date: string;
  count: number;
}

export interface AppState {
  token: string | null;
  currentPlayback: CurrentPlayback | null;
  selectedPlaylist: SpotifyPlaylist | null;
  playlistStats: PlaylistStats | null;
  audioFeatures: AudioFeatures | null;
  trackWithStats: TrackWithStats[];
  lastfmData: { [key: string]: number };
  showLastfmStats: boolean;
  isLoading: boolean;
  background: string;
} 