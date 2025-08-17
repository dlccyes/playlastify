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
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error making request to {url}: {e}")
            return None
    
    def _fetch_all_pages(self, url: str) -> List[Dict]:
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
    
    def _fetch_playlist_tracks(self, playlist_id: str) -> List[Dict]:
        if playlist_id == 'liked':
            url = 'https://api.spotify.com/v1/me/tracks?limit=50'
        else:
            url = f'https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100'
        
        return self._fetch_all_pages(url)
    
    def _fetch_audio_features_batched(self, track_ids: List[str]) -> List[Dict]:
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
    
    def _fetch_artist_genres_batched(self, artist_ids: List[str]) -> List[Dict]:
        artists = []
        batch_size = 50
        
        for i in range(0, len(artist_ids), batch_size):
            batch = artist_ids[i:i + batch_size]
            valid_ids = [id for id in batch if id and id != 'null']
            if not valid_ids:
                continue
                
            ids_string = ','.join(valid_ids)
            url = f'https://api.spotify.com/v1/artists?ids={ids_string}'
            
            data = self._make_request(url)
            if data and 'artists' in data:
                artists.extend(data['artists'])
        
        return artists
    
    def _extract_track_popularity(self, tracks: List[Dict]) -> float:
        return sum(track.get('track', {}).get('popularity', 0) for track in tracks)
    
    def _extract_audio_feature_averages(self, audio_features: List[Dict]) -> Dict[str, float]:
        valid_features = [f for f in audio_features if f]
        
        if not valid_features:
            return {
                'acousticness': 0, 'danceability': 0, 'duration_ms': 0, 'energy': 0,
                'instrumentalness': 0, 'liveness': 0, 'loudness': 0, 'speechiness': 0,
                'tempo': 0, 'valence': 0
            }
        
        feature_names = ['acousticness', 'danceability', 'duration_ms', 'energy', 
                        'instrumentalness', 'liveness', 'loudness', 'speechiness', 'tempo', 'valence']
        
        return {
            feature: sum(f[feature] for f in valid_features) / len(valid_features)
            for feature in feature_names
        }
    
    def _calculate_scrobbles_total(self, tracks: List[Dict], lastfm_data: Dict[str, int]) -> int:
        total_scrobbles = 0
        for track in tracks:
            track_data = track.get('track', {})
            title = f"{track_data.get('name', '')} - {track_data.get('artists', [{}])[0].get('name', '')}".lower()
            total_scrobbles += lastfm_data.get(title, 0)
        return total_scrobbles
    
    def _build_playlist_stats(self, total_tracks: int, avg_popularity: float, 
                             avg_duration: float, avg_tempo: float, avg_loudness: float,
                             total_scrobbles: Optional[int]) -> Dict:
        return {
            'totalTracks': total_tracks,
            'avgPopularity': round(avg_popularity),
            'avgDuration': avg_duration,
            'avgTempo': round(avg_tempo),
            'avgLoudness': round(avg_loudness),
            'totalScrobbles': total_scrobbles
        }
    
    def calculate_playlist_stats(self, tracks: List[Dict], audio_features: List[Dict], 
                               lastfm_data: Optional[Dict[str, int]] = None) -> Dict:
        valid_features = [f for f in audio_features if f]
        total_tracks = len(tracks)
        
        if not valid_features:
            return self._build_playlist_stats(total_tracks, 0, 0, 0, 0, None)
        
        avg_popularity = self._extract_track_popularity(tracks) / total_tracks
        avg_duration = sum(f['duration_ms'] for f in valid_features) / len(valid_features)
        avg_tempo = sum(f['tempo'] for f in valid_features) / len(valid_features)
        avg_loudness = sum(f['loudness'] for f in valid_features) / len(valid_features)
        
        total_scrobbles = None
        if lastfm_data:
            total_scrobbles = self._calculate_scrobbles_total(tracks, lastfm_data)
        
        return self._build_playlist_stats(total_tracks, avg_popularity, avg_duration, 
                                        avg_tempo, avg_loudness, total_scrobbles)
    
    def calculate_average_audio_features(self, audio_features: List[Dict]) -> Dict:
        return self._extract_audio_feature_averages(audio_features)
    
    def _extract_artist_names_from_tracks(self, tracks: List[Dict]) -> Dict[str, int]:
        artist_count = {}
        
        for track in tracks:
            track_data = track.get('track', {})
            artists = track_data.get('artists', [])
            for artist in artists:
                artist_name = artist.get('name', '')
                if artist_name:
                    artist_count[artist_name] = artist_count.get(artist_name, 0) + 1
        
        return artist_count
    
    def _build_artist_distribution_list(self, artist_count: Dict[str, int]) -> List[Dict]:
        artist_list = [{'artist': artist, 'count': count} for artist, count in artist_count.items()]
        return sorted(artist_list, key=lambda x: x['count'], reverse=True)
    
    def get_artist_distribution(self, tracks: List[Dict]) -> List[Dict]:
        artist_count = self._extract_artist_names_from_tracks(tracks)
        return self._build_artist_distribution_list(artist_count)
    
    def _extract_genres_from_artists(self, artists: List[Dict]) -> Tuple[Dict[str, int], Dict[str, int]]:
        genre_count = {}
        big_genre_count = {}
        
        for artist in artists:
            genres = artist.get('genres', [])
            big_genres_in_artist = []
            
            for genre in genres:
                genre_count[genre] = genre_count.get(genre, 0) + 1
                
                if 'lo-fi' in genre:
                    big_genres = genre.split(' ')
                else:
                    big_genres = re.split(r' |-', genre)
                
                for big_genre in big_genres:
                    if big_genre and big_genre not in big_genres_in_artist:
                        big_genre_count[big_genre] = big_genre_count.get(big_genre, 0) + 1
                        big_genres_in_artist.append(big_genre)
        
        return genre_count, big_genre_count
    
    def _build_genre_distribution_lists(self, genre_count: Dict[str, int], 
                                       big_genre_count: Dict[str, int]) -> Tuple[List[Dict], List[Dict]]:
        genre_data = [{'genre': genre, 'count': count} for genre, count in genre_count.items()]
        genre_data.sort(key=lambda x: x['count'], reverse=True)
        
        big_genre_data = [{'genre': genre, 'count': count} for genre, count in big_genre_count.items()]
        big_genre_data.sort(key=lambda x: x['count'], reverse=True)
        
        return genre_data, big_genre_data
    
    def get_genre_distribution(self, artists: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        genre_count, big_genre_count = self._extract_genres_from_artists(artists)
        return self._build_genre_distribution_lists(genre_count, big_genre_count)
    
    def _extract_date_from_track(self, track: Dict, date_type: str) -> Optional[str]:
        if date_type == 'added':
            return track.get('added_at', '')[:7]
        else:
            track_data = track.get('track', {})
            album = track_data.get('album', {})
            release_date = album.get('release_date')
            return release_date[:7] if release_date else None
    
    def _build_date_distribution_list(self, date_count: Dict[str, int]) -> List[Dict]:
        date_list = [{'date': date, 'count': count} for date, count in date_count.items()]
        return sorted(date_list, key=lambda x: x['date'])
    
    def get_date_distribution(self, tracks: List[Dict], date_type: str) -> List[Dict]:
        date_count = {}
        
        for track in tracks:
            date = self._extract_date_from_track(track, date_type)
            if date:
                date_count[date] = date_count.get(date, 0) + 1
        
        return self._build_date_distribution_list(date_count)
    
    def _calculate_days_since_added(self, added_at: str) -> int:
        if not added_at:
            return 0
        
        try:
            added_date = datetime.fromisoformat(added_at.replace('Z', '+00:00'))
            return (datetime.now(added_date.tzinfo) - added_date).days
        except:
            return 0
    
    def _extract_scrobbles_for_track(self, track: Dict, lastfm_data: Dict[str, int]) -> int:
        track_data = track.get('track', {})
        title = f"{track_data.get('name', '')} - {track_data.get('artists', [{}])[0].get('name', '')}".lower()
        return lastfm_data.get(title, 0)
    
    def _enrich_track_with_stats(self, track: Dict, lastfm_data: Optional[Dict[str, int]]) -> Dict:
        added_at = track.get('added_at', '')
        days_since_added = self._calculate_days_since_added(added_at)
        
        scrobbles = None
        if lastfm_data:
            scrobbles = self._extract_scrobbles_for_track(track, lastfm_data)
        
        return {
            **track,
            'daysSinceAdded': days_since_added,
            'scrobbles': scrobbles
        }
    
    def process_tracks_with_stats(self, tracks: List[Dict], 
                                lastfm_data: Optional[Dict[str, int]] = None) -> List[Dict]:
        return [self._enrich_track_with_stats(track, lastfm_data) for track in tracks]
    
    def _find_playlist_by_name(self, playlist_name: str, all_playlists: List[Dict], 
                              exact_match: bool) -> Optional[Dict]:
        for playlist in all_playlists:
            if exact_match:
                if playlist.get('name') == playlist_name:
                    return playlist
            else:
                if playlist_name.lower() in playlist.get('name', '').lower():
                    return playlist
        return None
    
    def _extract_track_ids(self, tracks: List[Dict]) -> List[str]:
        track_ids = []
        for track in tracks:
            track_data = track.get('track', {})
            if track_data.get('id'):
                track_ids.append(track_data['id'])
        return track_ids
    
    def _extract_artist_ids(self, tracks: List[Dict]) -> List[str]:
        artist_ids = []
        for track in tracks:
            track_data = track.get('track', {})
            artists = track_data.get('artists', [])
            for artist in artists:
                if artist.get('id'):
                    artist_ids.append(artist['id'])
        return artist_ids
    
    def _build_playlist_analysis_result(self, playlist: Dict, stats: Dict, 
                                       audio_features: Dict, artists: List[Dict], 
                                       genres: List[List[Dict]], dates: Dict, 
                                       processed_tracks: List[Dict]) -> Dict:
        return {
            'playlist': playlist,
            'stats': stats,
            'audioFeatures': audio_features,
            'artistData': artists,
            'genreData': genres,
            'dateData': dates,
            'tracksWithStats': processed_tracks
        }
    
    def analyze_playlist(self, playlist_name: str, exact_match: bool = False, 
                        is_liked_songs: bool = False, 
                        lastfm_data: Optional[Dict[str, int]] = None) -> Dict:
        try:
            tracks = []
            playlist = None
            
            if is_liked_songs:
                tracks = self._fetch_playlist_tracks('liked')
                playlist = {
                    'id': 'liked',
                    'name': 'Liked Songs',
                    'images': [],
                    'tracks': {'items': tracks, 'total': len(tracks)}
                }
            else:
                playlists_url = 'https://api.spotify.com/v1/me/playlists?limit=50'
                all_playlists = self._fetch_all_pages(playlists_url)
                
                found_playlist = self._find_playlist_by_name(playlist_name, all_playlists, exact_match)
                if not found_playlist:
                    return {'error': 'Playlist not found'}
                
                playlist = found_playlist
                tracks = self._fetch_playlist_tracks(found_playlist['id'])
            
            if not tracks:
                return {'error': 'No tracks found in this playlist'}
            
            track_ids = self._extract_track_ids(tracks)
            audio_features_data = self._fetch_audio_features_batched(track_ids)
            artist_ids = self._extract_artist_ids(tracks)
            artists_data = self._fetch_artist_genres_batched(artist_ids)
            
            avg_features = self.calculate_average_audio_features(audio_features_data)
            stats = self.calculate_playlist_stats(tracks, audio_features_data, lastfm_data)
            artists = self.get_artist_distribution(tracks)
            genres, big_genres = self.get_genre_distribution(artists_data)
            added_dates = self.get_date_distribution(tracks, 'added')
            released_dates = self.get_date_distribution(tracks, 'released')
            processed_tracks = self.process_tracks_with_stats(tracks, lastfm_data)
            
            return self._build_playlist_analysis_result(
                playlist, stats, avg_features, artists, [genres, big_genres],
                {'added': added_dates, 'released': released_dates}, processed_tracks
            )
            
        except Exception as e:
            print(f"Error analyzing playlist: {e}")
            return {'error': f'Error analyzing playlist: {str(e)}'} 