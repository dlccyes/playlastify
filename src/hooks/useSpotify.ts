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
  getCurrentPlayback,
  getAllPlaylists,
  getPlaylistTracks,
  getLikedSongs,
  getAudioFeatures,
  getArtistGenres,
  getTrackDetails,
  getArtistDetails
} from '../utils/spotify';
import {
  calculatePlaylistStats,
  calculateAverageAudioFeatures,
  getArtistDistribution,
  getGenreDistribution,
  getDateDistribution,
  processTracksWithStats
} from '../utils/dataProcessing';

export const useSpotify = () => {
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
          alert('Authentication failed. Please try again.');
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
      alert('Login failed. Please try again.');
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
      const playback = await getCurrentPlayback(token);
      setCurrentPlayback(playback);
      
      if (playback?.item) {
        // Get additional track details
        const [trackDetails, audioFeature] = await Promise.all([
          getTrackDetails(playback.item.id, token),
          getAudioFeatures([playback.item.id], token)
        ]);
        
        // Get artist genres
        const artistIds = playback.item.artists.map(a => a.id);
        const artistDetails = await getArtistGenres(artistIds, token);
        
        // Update current playback with additional data
        setCurrentPlayback(prev => ({
          ...prev!,
          item: {
            ...prev!.item!,
            ...trackDetails,
            audioFeatures: audioFeature[0],
            artistGenres: artistDetails.flatMap(a => a.genres || [])
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching current playback:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchPlaylists = useCallback(async () => {
    if (!token) return [];
    
    try {
      const playlistsData = await getAllPlaylists(token);
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

      let tracks: PlaylistTrack[] = [];
      let playlist: SpotifyPlaylist | null = null;
      
      if (isLikedSongs) {
        tracks = await getLikedSongs(token);
        playlist = {
          id: 'liked',
          name: 'Liked Songs',
          images: [],
          tracks: { items: tracks, total: tracks.length }
        };
      } else {
        const playlistsData = await fetchPlaylists();
        
        // Find matching playlist
        const foundPlaylist = playlistsData.find(p => {
          if (exactMatch) {
            return p.name === playlistName;
          } else {
            return p.name.toLowerCase().includes(playlistName.toLowerCase());
          }
        });
        
        if (!foundPlaylist) {
          alert('Playlist not found');
          return;
        }
        
        playlist = foundPlaylist;
        tracks = await getPlaylistTracks(foundPlaylist.id, token);
      }
      
      if (tracks.length === 0) {
        alert('No tracks found in this playlist');
        return;
      }
      
      // Get audio features
      const trackIds = tracks.map(t => t.track.id).filter(id => id);
      const audioFeaturesData = await getAudioFeatures(trackIds, token);
      
      // Get artist data for genres
      const artistIds = tracks.flatMap(t => t.track.artists.map(a => a.id));
      const artistsData = await getArtistGenres(artistIds, token);
      
      // Calculate stats and distributions
      const avgFeatures = calculateAverageAudioFeatures(audioFeaturesData);
      const stats = calculatePlaylistStats(tracks, audioFeaturesData, lastfmData);
      const artists = getArtistDistribution(tracks);
      const [genres, bigGenres] = getGenreDistribution(artistsData);
      const addedDates = getDateDistribution(tracks, 'added');
      const releasedDates = getDateDistribution(tracks, 'released');
      const processedTracks = processTracksWithStats(tracks, lastfmData);
      
      // Update state
      setSelectedPlaylist(playlist);
      setPlaylistTracks(tracks);
      setAudioFeatures(avgFeatures);
      setPlaylistStats(stats);
      setTracksWithStats(processedTracks);
      setArtistData(artists);
      setGenreData([genres, bigGenres]);
      setDateData({ added: addedDates, released: releasedDates });
      
    } catch (error) {
      console.error('Error analyzing playlist:', error);
      alert('Error analyzing playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchPlaylists]);

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