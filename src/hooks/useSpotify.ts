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

  // Initialize token from cookie or URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Remove code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Exchange code for token
      getTokenFromCode(code)
        .then(accessToken => {
          setToken(accessToken);
          document.cookie = `token=${accessToken}; path=/`;
        })
        .catch(error => {
          console.error('Error getting token:', error);
          onError?.('Authentication failed. Please try again.');
        });
    } else {
      // Try to get token from cookie
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      if (tokenCookie) {
        const tokenValue = tokenCookie.split('=')[1];
        setToken(tokenValue);
      }
    }
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
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setCurrentPlayback(null);
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setAudioFeatures(null);
    setPlaylistStats(null);
    setTracksWithStats([]);
  }, []);

  const fetchCurrentPlayback = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/current-playback`, {
        token
      });
      
      if (response.data.error) {
        console.error('Error fetching current playback:', response.data.error);
        return;
      }
      
      setCurrentPlayback(response.data);
    } catch (error) {
      console.error('Error fetching current playback:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchPlaylists = useCallback(async () => {
    if (!token) return [];
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/playlists`, {
        token
      });
      
      if (response.data.error) {
        console.error('Error fetching playlists:', response.data.error);
        return [];
      }
      
      const playlistsData = response.data.data || [];
      setPlaylists(playlistsData);
      return playlistsData;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  }, [token]);

  const analyzePlaylist = useCallback(async (
    playlistName: string, 
    exactMatch: boolean = false,
    isLikedSongs: boolean = false,
    lastfmData?: { [key: string]: number }
  ) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze-playlist`, {
        token,
        playlistName,
        exactMatch,
        isLikedSongs,
        lastfmData
      });
      
      if (response.data.error) {
        onError?.(response.data.error);
        return;
      }
      
      const {
        playlist,
        stats,
        audioFeatures,
        artistData: artists,
        genreData: genres,
        dateData: dates,
        tracksWithStats: processedTracks
      } = response.data;
      
      // Update state with processed data from backend
      setSelectedPlaylist(playlist);
      setPlaylistTracks(processedTracks); // Use processed tracks with stats
      setAudioFeatures(audioFeatures);
      setPlaylistStats(stats);
      setTracksWithStats(processedTracks);
      setArtistData(artists);
      setGenreData(genres);
      setDateData(dates);
      
    } catch (error) {
      console.error('Error analyzing playlist:', error);
      onError?.('Error analyzing playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Auto-fetch current playback when token is available
  useEffect(() => {
    if (token) {
      fetchCurrentPlayback();
    }
  }, [token, fetchCurrentPlayback]);

  return {
    // State
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
    
    // Actions
    login,
    logout,
    fetchCurrentPlayback,
    fetchPlaylists,
    analyzePlaylist
  };
}; 