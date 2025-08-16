import axios from 'axios';
import { SpotifyPlaylist, CurrentPlayback, AudioFeatures, PlaylistTrack } from '../types';

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

export const getSpotifyAuthUrl = async (): Promise<void> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/get-env`);
    const { clientID, redirect_uri } = response.data;
    
    const scopes = 'user-read-playback-state user-library-read playlist-read-private user-read-private';
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
    const response = await axios.get(`${BACKEND_URL}/request-token`, {
      params: { code }
    });
    return response.data.data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

export const spotifyRequest = async (url: string, token: string, iterAll = false): Promise<any> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/spagett`, {
      params: {
        url,
        token,
        iterAll: iterAll ? 1 : 0,
        useDB: 0,
        name: ''
      }
    });
    
    if (response.data.error) {
      throw new Error('Please login to Spotify');
    }
    
    return response.data;
  } catch (error) {
    console.error('Spotify request error:', error);
    throw error;
  }
};

export const getCurrentPlayback = async (token: string): Promise<CurrentPlayback | null> => {
  try {
    const data = await spotifyRequest('https://api.spotify.com/v1/me/player', token);
    return data;
  } catch (error) {
    console.error('Error getting current playback:', error);
    return null;
  }
};

export const getAllPlaylists = async (token: string): Promise<SpotifyPlaylist[]> => {
  try {
    const data = await spotifyRequest(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      token,
      true
    );
    return data.data || [];
  } catch (error) {
    console.error('Error getting playlists:', error);
    return [];
  }
};

export const getPlaylistTracks = async (playlistId: string, token: string): Promise<PlaylistTrack[]> => {
  try {
    const data = await spotifyRequest(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
      token,
      true
    );
    
    return data.data || [];
  } catch (error) {
    console.warn('Failed to get playlist tracks:', error);
    return [];
  }
};

export const getLikedSongs = async (token: string): Promise<PlaylistTrack[]> => {
  try {
    const data = await spotifyRequest(
      'https://api.spotify.com/v1/me/tracks?limit=50',
      token,
      true
    );
    return data.data || [];
  } catch (error) {
    console.error('Error getting liked songs:', error);
    return [];
  }
};

export const getAudioFeatures = async (trackIds: string[], token: string): Promise<AudioFeatures[]> => {
  const batchSize = 100;
  const features: AudioFeatures[] = [];
  
  
  
  for (let i = 0; i < trackIds.length; i += batchSize) {
    const batch = trackIds.slice(i, i + batchSize);
    const idsString = batch.join(',');
    
    try {
      const data = await spotifyRequest(
        `https://api.spotify.com/v1/audio-features?ids=${idsString}`,
        token
      );
      
      features.push(...(data.audio_features || []));
    } catch (error) {
      console.error('Error getting audio features:', error);
    }
  }
  
  
  return features;
};

export const getArtistGenres = async (artistIds: string[], token: string): Promise<any[]> => {
  const batchSize = 50;
  const artists: any[] = [];
  
  for (let i = 0; i < artistIds.length; i += batchSize) {
    const batch = artistIds.slice(i, i + batchSize).filter(id => id && id !== 'null');
    if (batch.length === 0) continue;
    
    const idsString = batch.join(',');
    
    try {
      const data = await spotifyRequest(
        `https://api.spotify.com/v1/artists?ids=${idsString}`,
        token
      );
      artists.push(...(data.artists || []));
    } catch (error) {
      console.warn('Failed to get artist genres for batch:', batch, error);
      // Continue with next batch instead of failing completely
      continue;
    }
  }
  
  return artists;
};

export const getTrackDetails = async (trackId: string, token: string): Promise<any> => {
  try {
    return await spotifyRequest(`https://api.spotify.com/v1/tracks/${trackId}`, token);
  } catch (error) {
    console.error('Error getting track details:', error);
    return null;
  }
};

export const getArtistDetails = async (artistId: string, token: string): Promise<any> => {
  try {
    return await spotifyRequest(`https://api.spotify.com/v1/artists/${artistId}`, token);
  } catch (error) {
    console.error('Error getting artist details:', error);
    return null;
  }
};

 