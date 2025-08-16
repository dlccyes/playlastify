import React, { useState } from 'react';
import { useSpotify } from './hooks/useSpotify';
import { getLastfmTopTracks } from './utils/lastfm';

// Components
import LoadingOverlay from './components/LoadingOverlay';
import AudioFeaturesRadarChart from './components/RadarChart';
import ArtistPieChart from './components/PieChart';
import DateLineChart from './components/LineChart';
import WordCloud from './components/WordCloud';
import TrackTable from './components/TrackTable';

function App() {
  const {
    token,
    isLoading,
    currentPlayback,
    selectedPlaylist,
    audioFeatures,
    playlistStats,
    playlistTracks,
    tracksWithStats,
    artistData,
    genreData,
    dateData,
    login,
    logout,
    fetchCurrentPlayback,
    analyzePlaylist
  } = useSpotify();

  // Last.fm state
  const [lastfmUsername, setLastfmUsername] = useState('');
  const [lastfmPeriod, setLastfmPeriod] = useState('7day');
  const [lastfmData, setLastfmData] = useState<{ [key: string]: number }>({});
  const [showLastfmStats, setShowLastfmStats] = useState(false);
  const [lastfmLoaded, setLastfmLoaded] = useState(false);
  const [lastfmLoading, setLastfmLoading] = useState(false);

  // Playlist search state
  const [playlistInput, setPlaylistInput] = useState('');
  const [exactMatch, setExactMatch] = useState(false);

  // Track search state
  const [trackSearchTerm, setTrackSearchTerm] = useState('');
  const [trackExactMatch, setTrackExactMatch] = useState(false);

  const handleLastfmLoad = async () => {
    if (!lastfmUsername.trim()) {
      alert('Please enter a Last.fm username');
      return;
    }

    try {
      setLastfmLoading(true);
      const data = await getLastfmTopTracks(lastfmUsername, lastfmPeriod);
      setLastfmData(data);
      setShowLastfmStats(true);
      setLastfmLoaded(true);
      alert(`${lastfmPeriod} scrobbles loaded! Search your Spotify playlist now!`);
    } catch (error) {
      alert('Failed to load Last.fm data. Check your username.');
      console.error('Last.fm error:', error);
    } finally {
      setLastfmLoading(false);
    }
  };

  const handlePlaylistAnalysis = (isLikedSongs = false) => {
    if (!isLikedSongs && !playlistInput.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    analyzePlaylist(
      isLikedSongs ? '' : playlistInput,
      exactMatch,
      isLikedSongs,
      showLastfmStats ? lastfmData : undefined
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      <LoadingOverlay isVisible={isLoading || lastfmLoading} />
      
      {/* Modern Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative z-10 container mx-auto px-6 py-16 text-center">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Playlastify
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover the hidden patterns in your Spotify playlists with advanced analytics and Last.fm integration
            </p>
          </div>
          
          {/* Authentication */}
          {!token ? (
            <button
              onClick={login}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span className="mr-2">🎵</span>
              Connect with Spotify
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center bg-green-500/20 border border-green-500/30 rounded-full px-6 py-3">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-green-400 font-medium">Connected to Spotify</span>
              </div>
              <button
                onClick={logout}
                className="px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      </header>

      {token && (
        <main className="container mx-auto px-6 py-12">
          {/* Current Playback Section */}
          <section className="mb-16">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Current Playback
                </h2>
                <div className="flex justify-center mb-4">
                  <button
                    onClick={fetchCurrentPlayback}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              
              {currentPlayback ? (
                currentPlayback.item ? (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    {/* Track Title */}
                    <h3 className="text-2xl font-bold text-white mb-6 text-center">
                      {currentPlayback.item.name} - {currentPlayback.item.artists.map(a => a.name).join(', ')}
                    </h3>
                    
                    {/* Main Content Grid - Same Layout as Playlist Info */}
                    <div className="flex flex-col lg:flex-row items-start gap-6">
                      {/* Album Art - Same Size as Playlist Image */}
                      <div className="flex-shrink-0">
                        {currentPlayback.item.album.images && currentPlayback.item.album.images.length > 0 ? (
                          <img 
                            src={currentPlayback.item.album.images[0].url} 
                            alt={`${currentPlayback.item.album.name} album cover`}
                            className="h-[350px] w-auto rounded-2xl shadow-lg object-cover opacity-90"
                          />
                        ) : (
                          <div className="h-[350px] w-auto bg-white/20 rounded-2xl flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-6xl mb-4">🎵</div>
                              <div className="text-sm text-white font-semibold">•{currentPlayback.item.artists[0]?.name?.toUpperCase()}•</div>
                              <div className="text-xs text-gray-300">{currentPlayback.item.album.name}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Stats - Always Show All Stats */}
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Popularity */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {currentPlayback.item.popularity}
                            </div>
                            <div className="text-sm text-gray-400">Popularity</div>
                          </div>
                          {/* Duration */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {Math.round(currentPlayback.item.duration_ms / 1000 / 60)}m{String(Math.round((currentPlayback.item.duration_ms / 1000) % 60)).padStart(2, '0')}s
                            </div>
                            <div className="text-sm text-gray-400">Duration</div>
                          </div>
                          {/* Tempo */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {currentPlayback.item.audioFeatures ? Math.round(currentPlayback.item.audioFeatures.tempo) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">Tempo</div>
                          </div>
                          {/* Loudness */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {currentPlayback.item.audioFeatures ? Math.round(currentPlayback.item.audioFeatures.loudness) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">Loudness</div>
                          </div>
                          {/* Artist Genres */}
                          <div className="text-center col-span-2">
                            <div className="text-sm text-gray-400 mb-2">Artist Genres</div>
                            <div className="text-sm text-white">
                              {currentPlayback.item.artistGenres && currentPlayback.item.artistGenres.length > 0 
                                ? currentPlayback.item.artistGenres.slice(0, 3).join(', ')
                                : 'none'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Audio Features Radar Chart - Always Show Chart Area */}
                      <div id="current-playback-radar" className="w-auto overflow-visible">
                        {currentPlayback.item.audioFeatures ? (
                          <AudioFeaturesRadarChart 
                            key="current-playback-radar" 
                            audioFeatures={currentPlayback.item.audioFeatures} 
                          />
                        ) : (
                          <AudioFeaturesRadarChart 
                            key="current-playback-radar-placeholder"
                            audioFeatures={{
                              valence: 0,
                              acousticness: 0,
                              danceability: 0,
                              energy: 0,
                              instrumentalness: 0,
                              speechiness: 0,
                              duration_ms: 0,
                              liveness: 0,
                              loudness: 0,
                              tempo: 0
                            }} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-4">🔇</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Track Playing</h3>
                    <p className="text-gray-400">Start playing a track on Spotify to see it here</p>
                  </div>
                )
              ) : (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-4">🎵</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Check</h3>
                  <p className="text-gray-400">Click the refresh button above to see what you're currently playing</p>
                </div>
              )}
            </div>
          </section>

          {/* Last.fm Integration Section */}
          <section className="mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  Last.fm Integration
                </h2>
                <p className="text-gray-400 text-lg">
                  Enhance your analysis with your Last.fm scrobbling data
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white">Load Your Data</h3>
                    <p className="text-gray-400 mb-6">
                      Enter your Last.fm username to get your listening history and enhance playlist analysis
                    </p>
                    
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter your Last.fm username"
                        value={lastfmUsername}
                        onChange={(e) => setLastfmUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleLastfmLoad()}
                      />
                      
                      <select
                        value={lastfmPeriod}
                        onChange={(e) => setLastfmPeriod(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="7day">Last 7 days</option>
                        <option value="1month">Last month</option>
                        <option value="3month">Last 3 months</option>
                        <option value="6month">Last 6 months</option>
                        <option value="12month">Last year</option>
                        <option value="overall">All time</option>
                      </select>
                      
                      <button
                        onClick={handleLastfmLoad}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
                      >
                        Load Last.fm Data
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    {lastfmLoaded ? (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
                        <div className="text-4xl mb-4">✅</div>
                        <h4 className="text-green-400 font-semibold mb-2">Data Loaded Successfully!</h4>
                        <p className="text-gray-400 text-sm">
                          {lastfmPeriod} scrobbles are now available for analysis
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="text-4xl mb-4">📊</div>
                        <h4 className="text-white font-semibold mb-2">Ready to Analyze</h4>
                        <p className="text-gray-400 text-sm">
                          Load your Last.fm data to get started
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Playlist Analysis Section */}
          <section className="mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Playlist Analysis
                </h2>
                <p className="text-gray-400 text-lg">
                  Analyze your Spotify playlists with advanced statistics and visualizations
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="grid md:grid-cols-2 gap-6 items-center mb-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white">Search Playlist</h3>
                    <p className="text-gray-400 mb-6">
                      Enter the name of a playlist to analyze, or analyze your Liked Songs
                    </p>
                    
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter playlist name"
                        value={playlistInput}
                        onChange={(e) => setPlaylistInput(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handlePlaylistAnalysis()}
                      />
                      
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exactMatch}
                            onChange={(e) => setExactMatch(e.target.checked)}
                            className="mr-2 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-400">Exact match</span>
                        </label>
                      </div>
                      
                      <button
                        onClick={() => handlePlaylistAnalysis()}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200"
                      >
                        Analyze Playlist
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => handlePlaylistAnalysis(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
                    >
                      Analyze Liked Songs
                    </button>
                    <p className="text-gray-400 text-sm mt-3">
                      Get insights into your favorite tracks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

                        {/* Results Section */}
              {selectedPlaylist && (
                <>
              {/* Merged Playlist Title and Analytics Dashboard */}
              <section className="mb-12">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    {/* Playlist Title and Basic Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                      <div>
                        <h2 className="text-3xl font-bold mb-2 text-white">
                          {selectedPlaylist.name}
                        </h2>

                      </div>
                      

                    </div>
                    

                    
                    {/* Playlist Meta - Image, Stats, and Audio Features in same container (Original proportions) */}
                    <div className="flex flex-col lg:flex-row items-start gap-6 mb-8">
                      {/* Playlist Image - Original size: 350px height */}
                      <div className="flex-shrink-0">
                        {selectedPlaylist.images && selectedPlaylist.images.length > 0 ? (
                          <img 
                            src={selectedPlaylist.images[0].url} 
                            alt={`${selectedPlaylist.name} cover`}
                            className="h-[350px] w-auto rounded-2xl shadow-lg object-cover opacity-90"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">No image available</div>
                        )}
                      </div>
                      
                      {/* Playlist Stats - Combined Basic and Audio Stats */}
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Basic Stats */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {playlistStats?.totalTracks || 0}
                            </div>
                            <div className="text-sm text-gray-400">Total Tracks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {artistData?.length || 0}
                            </div>
                            <div className="text-sm text-gray-400">Artists</div>
                          </div>
                          {/* Audio Stats */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {playlistStats && typeof playlistStats.avgPopularity === 'number' ? Math.round(playlistStats.avgPopularity) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">Avg Popularity</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {playlistStats && typeof playlistStats.avgTempo === 'number' ? Math.round(playlistStats.avgTempo) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">Avg BPM</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                              {playlistStats && typeof playlistStats.avgLoudness === 'number' ? Math.round(playlistStats.avgLoudness + 60) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">Avg Loudness</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                              {playlistStats && typeof playlistStats.avgDuration === 'number' ? Math.round(playlistStats.avgDuration / 60000) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">Avg Duration (min)</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Audio Features Radar Chart - No background, no duplicate title */}
                      <div id="playlist-info-radar" className="w-auto overflow-visible">
                        {audioFeatures ? (
                          <AudioFeaturesRadarChart 
                            key="playlist-info-radar" 
                            audioFeatures={audioFeatures} 
                          />
                        ) : (
                          <AudioFeaturesRadarChart 
                            key="playlist-info-radar-placeholder"
                            audioFeatures={{
                              valence: 0,
                              acousticness: 0,
                              danceability: 0,
                              energy: 0,
                              instrumentalness: 0,
                              speechiness: 0,
                              duration_ms: 0,
                              liveness: 0,
                              loudness: 0,
                              tempo: 0
                            }} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Artist Distribution + Top Artists Table */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Artist Distribution */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xl font-semibold mb-4 text-white">Artist Distribution</h4>
                      <div className="w-full">
                        {artistData && artistData.length > 0 && (
                          <ArtistPieChart 
                            data={artistData} 
                            title={`Artists in ${selectedPlaylist.name}`}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Artist Count Table */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xl font-semibold mb-4 text-white">Top 10 Artists</h4>
                      <div className="w-full">
                        {artistData && artistData.length > 0 && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-400 border-b border-white/10 pb-2">
                              <span>Artist</span>
                              <span className="text-center">Track Count</span>
                            </div>
                            {artistData.slice(0, 10).map((artist, index) => (
                              <div key={index} className="grid grid-cols-2 gap-4 py-2 border-b border-white/5">
                                <span className="text-white truncate">{artist.artist}</span>
                                <span className="text-gray-300 text-center">{artist.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Date Analysis - Added vs Released */}
                  <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xl font-semibold mb-4 text-white">Tracks Added Over Time</h4>
                      <div className="w-full">
                        {dateData && dateData.added && dateData.added.length > 0 && (
                          <DateLineChart 
                            data={dateData.added} 
                            title="Tracks Added Over Time"
                            xAxisLabel="Date"
                            yAxisLabel="Number of Tracks"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Release Date Analysis */}
                  <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xl font-semibold mb-4 text-white">Release Date Analysis</h4>
                      <div className="w-full">
                        {dateData && dateData.released && dateData.released.length > 0 && (
                          <DateLineChart 
                            data={dateData.released} 
                            title="Tracks Released Over Time"
                            xAxisLabel="Release Date"
                            yAxisLabel="Number of Tracks"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Genre Distribution Word Cloud */}
                  <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xl font-semibold mb-4 text-white">Genre Distribution</h4>
                      <div className="w-full">
                        {genreData && genreData[0] && genreData[0].length > 0 && (
                          <WordCloud 
                            key={`genre-${selectedPlaylist.id}-${genreData[0].length}`}
                            data={genreData[0]} 
                            title={`Genres in ${selectedPlaylist.name}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Genre Word Cloud */}
                  <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xl font-semibold mb-4 text-white">Genre Word Cloud</h4>
                      <div className="w-full">
                        {genreData && genreData[1] && genreData[1].length > 0 && (
                          <WordCloud 
                            key={`big-genre-${selectedPlaylist.id}-${genreData[1].length}`}
                            data={genreData[1]} 
                            title={`Genre Cloud of ${selectedPlaylist.name}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tracks Table */}
              <section className="mb-12">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-2xl font-bold mb-6 text-white">Track Details</h3>
                    
                    {/* Search Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search tracks by title or artist..."
                          value={trackSearchTerm}
                          onChange={(e) => setTrackSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={trackExactMatch}
                            onChange={(e) => setTrackExactMatch(e.target.checked)}
                            className="mr-2 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          Exact match
                        </label>
                      </div>
                    </div>
                    
                    <TrackTable 
                      tracks={tracksWithStats}
                      searchTerm={trackSearchTerm}
                      exactMatch={trackExactMatch}
                      showScrobbles={showLastfmStats}
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-400">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <a 
                href="https://github.com/dlccyes/playlastify" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <span>•</span>
              <span>Powered by Spotify API & Last.fm</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 