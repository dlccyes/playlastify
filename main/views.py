from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .spotify_analyzer import SpotifyAnalyzer

# Create your views here.
def index(request):
    return render(request, 'index.html')

def test_view(request):
    return JsonResponse({'message': 'Test view working!'}, status=200)

@csrf_exempt
@require_http_methods(["POST"])
def analyze_playlist(request):
    """Analyze a playlist and return processed statistics"""
    try:
        data = json.loads(request.body)
        token = data.get('token')
        playlist_name = data.get('playlistName')
        exact_match = data.get('exactMatch', False)
        is_liked_songs = data.get('isLikedSongs', False)
        lastfm_data = data.get('lastfmData')
        
        if not token:
            return JsonResponse({'error': 'Token is required'}, status=400)
        
        if not is_liked_songs and not playlist_name:
            return JsonResponse({'error': 'Playlist name is required'}, status=400)
        
        # Create analyzer and analyze playlist
        analyzer = SpotifyAnalyzer(token)
        result = analyzer.analyze_playlist(
            playlist_name=playlist_name or '',
            exact_match=exact_match,
            is_liked_songs=is_liked_songs,
            lastfm_data=lastfm_data
        )
        
        if 'error' in result:
            return JsonResponse(result, status=400)
        
        return JsonResponse(result, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in analyze_playlist: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def get_current_playback(request):
    """Get current playback with only essential data for frontend display"""
    try:
        data = json.loads(request.body)
        token = data.get('token')
        
        if not token:
            return JsonResponse({'error': 'Token is required'}, status=400)
        
        analyzer = SpotifyAnalyzer(token)
        
        # Get current playback
        playback_url = 'https://api.spotify.com/v1/me/player'
        playback_data = analyzer._make_request(playback_url)
        
        if not playback_data or not playback_data.get('item'):
            return JsonResponse({'item': None}, status=200)
        
        # Get audio features for the current track
        track_id = playback_data['item']['id']
        audio_features_url = f'https://api.spotify.com/v1/audio-features/{track_id}'
        audio_features = analyzer._make_request(audio_features_url)
        
        # Get artist genres
        artist_ids = [artist['id'] for artist in playback_data['item']['artists']]
        artists_data = analyzer.get_artist_genres(artist_ids)
        
        # Extract only essential data for frontend display
        essential_playback = {
            'is_playing': playback_data.get('is_playing', False),
            'progress_ms': playback_data.get('progress_ms', 0),
            'timestamp': playback_data.get('timestamp', 0),
            'item': {
                'id': playback_data['item']['id'],
                'name': playback_data['item']['name'],
                'duration_ms': playback_data['item']['duration_ms'],
                'popularity': playback_data['item'].get('popularity', 0),
                'external_urls': playback_data['item']['external_urls'],
                'artists': [
                    {
                        'id': artist['id'],
                        'name': artist['name']
                    }
                    for artist in playback_data['item']['artists']
                ],
                'album': {
                    'id': playback_data['item']['album']['id'],
                    'name': playback_data['item']['album']['name'],
                    'album_type': playback_data['item']['album'].get('album_type'),
                    'total_tracks': playback_data['item']['album'].get('total_tracks'),
                    'images': playback_data['item']['album']['images'],
                    'external_urls': playback_data['item']['album']['external_urls'],
                    'release_date': playback_data['item']['album'].get('release_date'),
                    'release_date_precision': playback_data['item']['album'].get('release_date_precision')
                },
                'audioFeatures': audio_features,
                'artistGenres': [genre for artist in artists_data for genre in artist.get('genres', [])]
            }
        }
        
        return JsonResponse(essential_playback, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in get_current_playback: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def get_playlists(request):
    """Get all user playlists with only essential data"""
    try:
        data = json.loads(request.body)
        token = data.get('token')
        
        if not token:
            return JsonResponse({'error': 'Token is required'}, status=400)
        
        analyzer = SpotifyAnalyzer(token)
        playlists_url = 'https://api.spotify.com/v1/me/playlists?limit=50'
        raw_playlists = analyzer._iterate_all(playlists_url)
        
        # Extract only essential playlist data
        essential_playlists = []
        for playlist in raw_playlists:
            essential_playlists.append({
                'id': playlist['id'],
                'name': playlist['name'],
                'description': playlist.get('description', ''),
                'images': playlist['images'],
                'external_urls': playlist['external_urls'],
                'tracks': {
                    'total': playlist['tracks']['total']
                },
                'owner': {
                    'display_name': playlist['owner']['display_name']
                },
                'public': playlist.get('public', False),
                'collaborative': playlist.get('collaborative', False)
            })
        
        return JsonResponse({'data': essential_playlists}, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in get_playlists: {e}")
        return JsonResponse({'error': str(e)}, status=500)
