import { 
  PlaylistTrack, 
  AudioFeatures, 
  ArtistData, 
  GenreData, 
  DateData, 
  TrackWithStats,
  PlaylistStats
} from '../types';
import { daysSinceDate } from './lastfm';

const ARTIST_SEP = ' － ';

export const calculatePlaylistStats = (
  tracks: PlaylistTrack[],
  audioFeatures: AudioFeatures[],
  lastfmData?: { [key: string]: number }
): PlaylistStats => {
  const validFeatures = audioFeatures.filter(f => f !== null);
  const totalTracks = tracks.length;
  
  if (validFeatures.length === 0) {
    return {
      totalTracks,
      avgPopularity: 0,
      avgDuration: 0,
      avgTempo: 0,
      avgLoudness: 0
    };
  }
  
  const avgPopularity = tracks.reduce((sum, track) => sum + (track.track.popularity || 0), 0) / totalTracks;
  const avgDuration = validFeatures.reduce((sum, f) => sum + f.duration_ms, 0) / validFeatures.length;
  const avgTempo = validFeatures.reduce((sum, f) => sum + f.tempo, 0) / validFeatures.length;
  const avgLoudness = validFeatures.reduce((sum, f) => sum + f.loudness, 0) / validFeatures.length;
  
  let totalScrobbles = 0;
  if (lastfmData) {
    tracks.forEach(track => {
      const title = `${track.track.name} - ${track.track.artists[0]?.name}`.toLowerCase();
      totalScrobbles += lastfmData[title] || 0;
    });
  }
  
  return {
    totalTracks,
    avgPopularity: Math.round(avgPopularity),
    avgDuration: avgDuration, // Don't round - preserve precision for mm:ss format
    avgTempo: Math.round(avgTempo),
    avgLoudness: Math.round(avgLoudness),
    totalScrobbles: lastfmData ? totalScrobbles : undefined
  };
};

export const calculateAverageAudioFeatures = (audioFeatures: AudioFeatures[]): AudioFeatures => {
  const validFeatures = audioFeatures.filter(f => f !== null);
  
  if (validFeatures.length === 0) {
    return {
      acousticness: 0,
      danceability: 0,
      duration_ms: 0,
      energy: 0,
      instrumentalness: 0,
      liveness: 0,
      loudness: 0,
      speechiness: 0,
      tempo: 0,
      valence: 0
    };
  }
  
  const avg = {
    acousticness: 0,
    danceability: 0,
    duration_ms: 0,
    energy: 0,
    instrumentalness: 0,
    liveness: 0,
    loudness: 0,
    speechiness: 0,
    tempo: 0,
    valence: 0
  };
  
  for (const feature of validFeatures) {
    avg.acousticness += feature.acousticness;
    avg.danceability += feature.danceability;
    avg.duration_ms += feature.duration_ms;
    avg.energy += feature.energy;
    avg.instrumentalness += feature.instrumentalness;
    avg.liveness += feature.liveness;
    avg.loudness += feature.loudness;
    avg.speechiness += feature.speechiness;
    avg.tempo += feature.tempo;
    avg.valence += feature.valence;
  }
  
  const count = validFeatures.length;
  return {
    acousticness: avg.acousticness / count,
    danceability: avg.danceability / count,
    duration_ms: avg.duration_ms / count,
    energy: avg.energy / count,
    instrumentalness: avg.instrumentalness / count,
    liveness: avg.liveness / count,
    loudness: avg.loudness / count,
    speechiness: avg.speechiness / count,
    tempo: avg.tempo / count,
    valence: avg.valence / count
  };
};

export const getArtistDistribution = (tracks: PlaylistTrack[]): ArtistData[] => {
  const artistCount: { [key: string]: number } = {};
  
  for (const track of tracks) {
    for (const artist of track.track.artists) {
      artistCount[artist.name] = (artistCount[artist.name] || 0) + 1;
    }
  }
  
  return Object.entries(artistCount)
    .map(([artist, count]) => ({ artist, count }))
    .sort((a, b) => b.count - a.count);
};

export const getGenreDistribution = (artists: any[]): [GenreData[], GenreData[]] => {
  const genreCount: { [key: string]: number } = {};
  const bigGenreCount: { [key: string]: number } = {};
  
  for (const artist of artists) {
    const bigGenresInArtist: string[] = [];
    
    for (const genre of artist.genres || []) {
      // Specific genres
      genreCount[genre] = (genreCount[genre] || 0) + 1;
      
      // Big genres (word extraction)
      let bigGenres: string[];
      if (genre.includes('lo-fi')) {
        bigGenres = genre.split(' ');
      } else {
        bigGenres = genre.split(/ |-/);
      }
      
      for (const bigGenre of bigGenres) {
        if (!bigGenresInArtist.includes(bigGenre)) {
          bigGenreCount[bigGenre] = (bigGenreCount[bigGenre] || 0) + 1;
          bigGenresInArtist.push(bigGenre);
        }
      }
    }
  }
  
  const genreData = Object.entries(genreCount)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
    
  const bigGenreData = Object.entries(bigGenreCount)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
  
  return [genreData, bigGenreData];
};

export const getDateDistribution = (tracks: PlaylistTrack[], type: 'added' | 'released'): DateData[] => {
  const dateCount: { [key: string]: number } = {};
  
  for (const track of tracks) {
    let date: string;
    
    if (type === 'added') {
      date = track.added_at.slice(0, 7); // YYYY-MM
    } else {
      if (!track.track.album.release_date) continue;
      date = track.track.album.release_date.slice(0, 7); // YYYY-MM
    }
    
    dateCount[date] = (dateCount[date] || 0) + 1;
  }
  
  return Object.entries(dateCount)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const processTracksWithStats = (
  tracks: PlaylistTrack[],
  lastfmData?: { [key: string]: number }
): TrackWithStats[] => {
  return tracks.map(track => {
    const daysSinceAdded = daysSinceDate(track.added_at);
    let scrobbles: number | undefined;
    
    if (lastfmData) {
      const title = `${track.track.name} - ${track.track.artists[0]?.name}`.toLowerCase();
      scrobbles = lastfmData[title] || 0;
    }
    
    return {
      ...track,
      daysSinceAdded,
      scrobbles
    };
  });
};

export const searchTracks = (
  tracks: TrackWithStats[],
  searchTerm: string,
  exactMatch: boolean = false
): TrackWithStats[] => {
  if (!searchTerm.trim()) return tracks;
  
  return tracks.filter(track => {
    const searchText = `${track.track.name} ${track.track.artists.map(a => a.name).join(' ')}`;
    
    if (exactMatch) {
      const regex = new RegExp(`\\b${searchTerm}\\b`);
      return regex.test(searchText);
    } else {
      return searchText.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });
};

export const sortTracks = (
  tracks: TrackWithStats[],
  sortBy: 'name' | 'artist' | 'daysSinceAdded' | 'scrobbles',
  sortOrder: 'asc' | 'desc' = 'desc'
): TrackWithStats[] => {
  return [...tracks].sort((a, b) => {
    let valueA: any;
    let valueB: any;
    
    switch (sortBy) {
      case 'name':
        valueA = a.track.name.toLowerCase();
        valueB = b.track.name.toLowerCase();
        break;
      case 'artist':
        valueA = a.track.artists[0]?.name.toLowerCase() || '';
        valueB = b.track.artists[0]?.name.toLowerCase() || '';
        break;
      case 'daysSinceAdded':
        valueA = a.daysSinceAdded;
        valueB = b.daysSinceAdded;
        break;
      case 'scrobbles':
        valueA = a.scrobbles || 0;
        valueB = b.scrobbles || 0;
        break;
      default:
        return 0;
    }
    
    if (typeof valueA === 'string') {
      const comparison = valueA.localeCompare(valueB);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = valueA - valueB;
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });
}; 

export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};