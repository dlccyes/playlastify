import axios from 'axios';
import { LastfmTrack } from '../types';

const LASTFM_API_KEY = 'df7b292e433f23776b084ff739c37918';
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export const getLastfmTopTracks = async (
  username: string,
  period: string
): Promise<{ [key: string]: number }> => {
  const tracksCount: { [key: string]: number } = {};
  
  try {
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const response = await axios.get(LASTFM_API_URL, {
        params: {
          method: 'user.gettoptracks',
          user: username,
          period: period,
          page: page,
          api_key: LASTFM_API_KEY,
          format: 'json'
        },
        timeout: 5000
      });
      
      const data = response.data;
      
      if (!data.toptracks || data.toptracks['@attr'].totalPages === '0') {
        throw new Error('No scrobbles found for this period');
      }
      
      const tracks = Array.isArray(data.toptracks.track) 
        ? data.toptracks.track 
        : [data.toptracks.track];
        
      for (const track of tracks) {
        const title = `${track.name} - ${track.artist.name}`.toLowerCase();
        tracksCount[title] = parseInt(track.playcount);
      }
      
      const currentPage = parseInt(data.toptracks['@attr'].page);
      const totalPages = parseInt(data.toptracks['@attr'].totalPages);
      
      if (currentPage >= totalPages) {
        hasMorePages = false;
      } else {
        page++;
      }
    }
    
    return tracksCount;
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    throw error;
  }
};

export const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 1000 / 60);
  const seconds = Math.round((durationMs / 1000) % 60);
  return `${minutes}m${seconds}s`;
};

export const daysSinceDate = (dateString: string): number => {
  const target = new Date(dateString);
  const today = new Date();
  return Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}; 