import { TrackWithStats } from '../types';

export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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