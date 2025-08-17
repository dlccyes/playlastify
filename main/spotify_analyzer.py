import requests
import json
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime
import re

class SpotifyAnalyzer:
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
        }
    
    def _make_request(self, url: str) -> Optional[Dict]:
        """Make a request to Spotify API"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error making request to {url}: {e}")
            return None
    
    def _iterate_all(self, url: str) -> List[Dict]:
        """Iterate through all pages of a paginated endpoint"""
        result = []
        next_url = url
        
        while next_url:
            data = self._make_request(next_url)
            if not data:
                break
                
            if 'items' in data:
                result.extend(data['items'])
            
            next_url = data.get('next')
            
        return result
    
    def get_playlist_tracks(self, playlist_id: str) -> List[Dict]:
        """Get all tracks from a playlist"""
        if playlist_id == 'liked':
            url = 'https://api.spotify.com/v1/me/tracks?limit=50'
        else:
            url = f'https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100'
        
        return self._iterate_all(url)
    
    def get_audio_features(self, track_ids: List[str]) -> List[Dict]:
        """Get audio features for multiple tracks"""
        features = []
        batch_size = 100
        
        for i in range(0, len(track_ids), batch_size):
            batch = track_ids[i:i + batch_size]
            ids_string = ','.join(batch)
            url = f'https://api.spotify.com/v1/audio-features?ids={ids_string}'
            
            data = self._make_request(url)
            if data and 'audio_features' in data:
                features.extend(data['audio_features'])
        
        return features
    
    def get_artist_genres(self, artist_ids: List[str]) -> List[Dict]:
        """Get genres for multiple artists"""
        artists = []
        batch_size = 50
        
        for i in range(0, len(artist_ids), batch_size):
            batch = artist_ids[i:i + batch_size]
            batch = [id for id in batch if id and id != 'null']
            if not batch:
                continue
                
            ids_string = ','.join(batch)
            url = f'https://api.spotify.com/v1/artists?ids={ids_string}'
            
            data = self._make_request(url)
            if data and 'artists' in data:
                artists.extend(data['artists'])
        
        return artists
    
    def calculate_playlist_stats(self, tracks: List[Dict], audio_features: List[Dict], 
                               lastfm_data: Optional[Dict[str, int]] = None) -> Dict:
        """Calculate playlist statistics"""
        valid_features = [f for f in audio_features if f]
        total_tracks = len(tracks)
        
        if not valid_features:
            return {
                'totalTracks': total_tracks,
                'avgPopularity': 0,
                'avgDuration': 0,
                'avgTempo': 0,
                'avgLoudness': 0
            }
        
        avg_popularity = sum(track.get('track', {}).get('popularity', 0) for track in tracks) / total_tracks
        avg_duration = sum(f['duration_ms'] for f in valid_features) / len(valid_features)
        avg_tempo = sum(f['tempo'] for f in valid_features) / len(valid_features)
        avg_loudness = sum(f['loudness'] for f in valid_features) / len(valid_features)
        
        total_scrobbles = 0
        if lastfm_data:
            for track in tracks:
                track_name = track.get('track', {})
                title = f"{track_name.get('name', '')} - {track_name.get('artists', [{}])[0].get('name', '')}".lower()
                total_scrobbles += lastfm_data.get(title, 0)
        
        return {
            'totalTracks': total_tracks,
            'avgPopularity': round(avg_popularity),
            'avgDuration': avg_duration,
            'avgTempo': round(avg_tempo),
            'avgLoudness': round(avg_loudness),
            'totalScrobbles': total_scrobbles if lastfm_data else None
        }
    
    def calculate_average_audio_features(self, audio_features: List[Dict]) -> Dict:
        """Calculate average audio features"""
        valid_features = [f for f in audio_features if f]
        
        if not valid_features:
            return {
                'acousticness': 0, 'danceability': 0, 'duration_ms': 0, 'energy': 0,
                'instrumentalness': 0, 'liveness': 0, 'loudness': 0, 'speechiness': 0,
                'tempo': 0, 'valence': 0
            }
        
        feature_names = ['acousticness', 'danceability', 'duration_ms', 'energy', 
                        'instrumentalness', 'liveness', 'loudness', 'speechiness', 'tempo', 'valence']
        
        avg_features = {}
        for feature in feature_names:
            avg_features[feature] = sum(f[feature] for f in valid_features) / len(valid_features)
        
        return avg_features
    
    def get_artist_distribution(self, tracks: List[Dict]) -> List[Dict]:
        """Get artist distribution from tracks"""
        artist_count = {}
        
        for track in tracks:
            track_data = track.get('track', {})
            artists = track_data.get('artists', [])
            for artist in artists:
                artist_name = artist.get('name', '')
                if artist_name:
                    artist_count[artist_name] = artist_count.get(artist_name, 0) + 1
        
        # Convert to list and sort by count
        artist_list = [{'artist': artist, 'count': count} for artist, count in artist_count.items()]
        return sorted(artist_list, key=lambda x: x['count'], reverse=True)
    
    def get_genre_distribution(self, artists: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Get genre distribution from artists"""
        genre_count = {}
        big_genre_count = {}
        
        for artist in artists:
            genres = artist.get('genres', [])
            big_genres_in_artist = []
            
            for genre in genres:
                # Specific genres
                genre_count[genre] = genre_count.get(genre, 0) + 1
                
                # Big genres (word extraction)
                if 'lo-fi' in genre:
                    big_genres = genre.split(' ')
                else:
                    big_genres = re.split(r' |-', genre)
                
                for big_genre in big_genres:
                    if big_genre and big_genre not in big_genres_in_artist:
                        big_genre_count[big_genre] = big_genre_count.get(big_genre, 0) + 1
                        big_genres_in_artist.append(big_genre)
        
        # Convert to lists and sort
        genre_data = [{'genre': genre, 'count': count} for genre, count in genre_count.items()]
        genre_data.sort(key=lambda x: x['count'], reverse=True)
        
        big_genre_data = [{'genre': genre, 'count': count} for genre, count in big_genre_count.items()]
        big_genre_data.sort(key=lambda x: x['count'], reverse=True)
        
        return genre_data, big_genre_data
    
    def get_date_distribution(self, tracks: List[Dict], date_type: str) -> List[Dict]:
        """Get date distribution from tracks"""
        date_count = {}
        
        for track in tracks:
            if date_type == 'added':
                date = track.get('added_at', '')[:7]  # YYYY-MM
            else:  # released
                track_data = track.get('track', {})
                album = track_data.get('album', {})
                release_date = album.get('release_date')
                if not release_date:
                    continue
                date = release_date[:7]  # YYYY-MM
            
            if date:
                date_count[date] = date_count.get(date, 0) + 1
        
        # Convert to list and sort by date
        date_list = [{'date': date, 'count': count} for date, count in date_count.items()]
        return sorted(date_list, key=lambda x: x['date'])
    
    def process_tracks_with_stats(self, tracks: List[Dict], 
                                lastfm_data: Optional[Dict[str, int]] = None) -> List[Dict]:
        """Process tracks with additional statistics"""
        processed_tracks = []
        
        for track in tracks:
            track_data = track.get('track', {})
            added_at = track.get('added_at', '')
            
            # Calculate days since added
            days_since_added = 0
            if added_at:
                try:
                    added_date = datetime.fromisoformat(added_at.replace('Z', '+00:00'))
                    days_since_added = (datetime.now(added_date.tzinfo) - added_date).days
                except:
                    days_since_added = 0
            
            # Get scrobbles from Last.fm data
            scrobbles = None
            if lastfm_data:
                title = f"{track_data.get('name', '')} - {track_data.get('artists', [{}])[0].get('name', '')}".lower()
                scrobbles = lastfm_data.get(title, 0)
            
            processed_track = {
                **track,
                'daysSinceAdded': days_since_added,
                'scrobbles': scrobbles
            }
            processed_tracks.append(processed_track)
        
        return processed_tracks
    
    def analyze_playlist(self, playlist_name: str, exact_match: bool = False, 
                        is_liked_songs: bool = False, 
                        lastfm_data: Optional[Dict[str, int]] = None) -> Dict:
        """Main method to analyze a playlist and return processed data"""
        try:
            tracks = []
            playlist = None
            
            if is_liked_songs:
                tracks = self.get_playlist_tracks('liked')
                playlist = {
                    'id': 'liked',
                    'name': 'Liked Songs',
                    'images': [],
                    'tracks': {'items': tracks, 'total': len(tracks)}
                }
            else:
                # Get all playlists first
                playlists_url = 'https://api.spotify.com/v1/me/playlists?limit=50'
                all_playlists = self._iterate_all(playlists_url)
                
                # Find matching playlist
                found_playlist = None
                for p in all_playlists:
                    if exact_match:
                        if p.get('name') == playlist_name:
                            found_playlist = p
                            break
                    else:
                        if playlist_name.lower() in p.get('name', '').lower():
                            found_playlist = p
                            break
                
                if not found_playlist:
                    return {'error': 'Playlist not found'}
                
                playlist = found_playlist
                tracks = self.get_playlist_tracks(found_playlist['id'])
            
            if not tracks:
                return {'error': 'No tracks found in this playlist'}
            
            # Get track IDs for audio features
            track_ids = []
            for track in tracks:
                track_data = track.get('track', {})
                if track_data.get('id'):
                    track_ids.append(track_data['id'])
            
            # Get audio features
            audio_features_data = self.get_audio_features(track_ids)
            
            # Get artist data for genres
            artist_ids = []
            for track in tracks:
                track_data = track.get('track', {})
                artists = track_data.get('artists', [])
                for artist in artists:
                    if artist.get('id'):
                        artist_ids.append(artist['id'])
            
            artists_data = self.get_artist_genres(artist_ids)
            
            # Calculate all statistics
            avg_features = self.calculate_average_audio_features(audio_features_data)
            stats = self.calculate_playlist_stats(tracks, audio_features_data, lastfm_data)
            artists = self.get_artist_distribution(tracks)
            genres, big_genres = self.get_genre_distribution(artists_data)
            added_dates = self.get_date_distribution(tracks, 'added')
            released_dates = self.get_date_distribution(tracks, 'released')
            processed_tracks = self.process_tracks_with_stats(tracks, lastfm_data)
            
            return {
                'playlist': playlist,
                'stats': stats,
                'audioFeatures': avg_features,
                'artistData': artists,
                'genreData': [genres, big_genres],
                'dateData': {
                    'added': added_dates,
                    'released': released_dates
                },
                'tracksWithStats': processed_tracks
            }
            
        except Exception as e:
            print(f"Error analyzing playlist: {e}")
            return {'error': f'Error analyzing playlist: {str(e)}'} 