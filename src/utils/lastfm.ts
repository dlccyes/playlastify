import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

export const getLastfmTopTracks = async (
  username: string,
  period: string
): Promise<{ [key: string]: number }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/lastfm-top-tracks`, {
      params: {
        username: username,
        period: period
      },
      timeout: 10000
    });
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return response.data.data;
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