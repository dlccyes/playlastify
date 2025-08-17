import { useState, useEffect, useCallback } from 'react';
import {
  SpotifyPlaylist,
  CurrentPlayback,
  AudioFeatures,
  PlaylistTrack,
  TrackWithStats,
  PlaylistStats
} from '../types';
import {
  getSpotifyAuthUrl,
  getTokenFromCode,
} from '../utils/spotify';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useSpotify = (onError?: (message: string) => void) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlayback, setCurrentPlayback] = useState<CurrentPlayback | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [playlistStats, setPlaylistStats] = useState<PlaylistStats | null>(null);
  const [tracksWithStats, setTracksWithStats] = useState<TrackWithStats[]>([]);
  const [artistData, setArtistData] = useState<any[]>([]);
  const [genreData, setGenreData] = useState<[any[], any[]]>([[], []]);
  const [dateData, setDateData] = useState<{ added: any[], released: any[] }>({ added: [], released: [] });

  const _extractTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  const _storeTokenInCookie = (accessToken: string): void => {
    document.cookie = `token=${accessToken}; path=/`;
  };

  const _clearTokenFromCookie = (): void => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  };

  const _resetAllState = (): void => {
    setCurrentPlayback(null);
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setAudioFeatures(null);
    setPlaylistStats(null);
    setTracksWithStats([]);
  };

  const _handleTokenFromCode = async (code: string): Promise<void> => {
    try {
      const accessToken = await getTokenFromCode(code);
      setToken(accessToken);
      _storeTokenInCookie(accessToken);
    } catch (error) {
      console.error('Error getting token:', error);
      onError?.('Authentication failed. Please try again.');
    }
  };

  const _initializeTokenFromUrlOrCookie = (): void => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      _handleTokenFromCode(code);
    } else {
      const tokenValue = _extractTokenFromCookie();
      if (tokenValue) {
        setToken(tokenValue);
      }
    }
  };

  useEffect(() => {
    _initializeTokenFromUrlOrCookie();
  }, []);

  const login = useCallback(async () => {
    try {
      await getSpotifyAuthUrl();
    } catch (error) {
      console.error('Login error:', error);
      onError?.('Login failed. Please try again.');
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    _clearTokenFromCookie();
    _resetAllState();
  }, []);

  const _makeApiRequest = async (endpoint: string, data: any): Promise<any> => {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
    return response.data;
  };

  const _handleApiError = (error: any, errorMessage: string): void => {
    console.error(errorMessage, error);
    onError?.(errorMessage);
  };

  const fetchCurrentPlayback = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const responseData = await _makeApiRequest('/api/current-playback', { token });
      
      if (responseData.error) {
        console.error('Error fetching current playback:', responseData.error);
        return;
      }
      
      setCurrentPlayback(responseData);
    } catch (error) {
      _handleApiError(error, 'Error fetching current playback');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchPlaylists = useCallback(async () => {
    if (!token) return [];
    
    try {
      const responseData = await _makeApiRequest('/api/playlists', { token });
      
      if (responseData.error) {
        console.error('Error fetching playlists:', responseData.error);
        return [];
      }
      
      const playlistsData = responseData.data || [];
      setPlaylists(playlistsData);
      return playlistsData;
    } catch (error) {
      _handleApiError(error, 'Error fetching playlists');
      return [];
    }
  }, [token]);

  const _updatePlaylistAnalysisState = (responseData: any): void => {
    const {
      playlist,
      stats,
      audioFeatures,
      artistData: artists,
      genreData: genres,
      dateData: dates,
      tracksWithStats: processedTracks
    } = responseData;
    
    setSelectedPlaylist(playlist);
    setPlaylistTracks(processedTracks);
    setAudioFeatures(audioFeatures);
    setPlaylistStats(stats);
    setTracksWithStats(processedTracks);
    setArtistData(artists);
    setGenreData(genres);
    setDateData(dates);
  };

  const analyzePlaylist = useCallback(async (
    playlistName: string, 
    exactMatch: boolean = false,
    isLikedSongs: boolean = false,
    lastfmData?: { [key: string]: number }
  ) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const responseData = await _makeApiRequest('/api/analyze-playlist', {
        token,
        playlistName,
        exactMatch,
        isLikedSongs,
        lastfmData
      });
      
      if (responseData.error) {
        onError?.(responseData.error);
        return;
      }
      
      _updatePlaylistAnalysisState(responseData);
      
    } catch (error) {
      _handleApiError(error, 'Error analyzing playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCurrentPlayback();
    }
  }, [token, fetchCurrentPlayback]);

  return {
    token,
    isLoading,
    currentPlayback,
    playlists,
    selectedPlaylist,
    playlistTracks,
    audioFeatures,
    playlistStats,
    tracksWithStats,
    artistData,
    genreData,
    dateData,
    login,
    logout,
    fetchCurrentPlayback,
    fetchPlaylists,
    analyzePlaylist
  };
}; 