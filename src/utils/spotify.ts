import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const getSpotifyAuthUrl = async (): Promise<void> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get-env`);
    const { clientID, redirect_uri } = response.data;
    
    const scopes = 'user-read-playback-state user-library-read playlist-read-private';
    const url = 'https://accounts.spotify.com/authorize' +
      `?client_id=${clientID}` +
      '&response_type=code' +
      `&redirect_uri=${encodeURI(redirect_uri)}` +
      `&scope=${scopes}` +
      '&show_dialog=true';
    
    window.location.href = url;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
};

export const getTokenFromCode = async (code: string): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/request-token`, {
      params: { code }
    });
    return response.data.data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

 