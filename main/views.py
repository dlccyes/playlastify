from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .spotify_analyzer import SpotifyAnalyzer

def index(request):
    return render(request, 'index.html')

def test_view(request):
    return JsonResponse({'message': 'Test view working!'}, status=200)

def _validate_playlist_request(data: dict) -> tuple[bool, str, dict]:
    token = data.get('token')
    playlist_name = data.get('playlistName')
    exact_match = data.get('exactMatch', False)
    is_liked_songs = data.get('isLikedSongs', False)
    lastfm_data = data.get('lastfmData')
    
    if not token:
        return False, 'Token is required', {}
    
    if not is_liked_songs and not playlist_name:
        return False, 'Playlist name is required', {}
    
    return True, '', {
        'token': token,
        'playlist_name': playlist_name or '',
        'exact_match': exact_match,
        'is_liked_songs': is_liked_songs,
        'lastfm_data': lastfm_data
    }

@csrf_exempt
@require_http_methods(["POST"])
def analyze_playlist(request):
    try:
        data = json.loads(request.body)
        is_valid, error_message, params = _validate_playlist_request(data)
        
        if not is_valid:
            return JsonResponse({'error': error_message}, status=400)
        
        analyzer = SpotifyAnalyzer(params['token'])
        # Remove token from params before calling analyze_playlist
        method_params = {k: v for k, v in params.items() if k != 'token'}
        result = analyzer.analyze_playlist(**method_params)
        
        if 'error' in result:
            return JsonResponse(result, status=400)
        
        return JsonResponse(result, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in analyze_playlist: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def _extract_playback_data(playback_data: dict) -> dict:
    track_id = playback_data['item']['id']
    artist_ids = [artist['id'] for artist in playback_data['item']['artists']]
    
    return {
        'track_id': track_id,
        'artist_ids': artist_ids,
        'album_id': playback_data['item']['album']['id']
    }

def _build_essential_playback_response(playback_data: dict, audio_features: dict, 
                                     artists_data: list) -> dict:
    track_info = playback_data['item']
    album_info = track_info['album']
    
    return {
        'is_playing': playback_data.get('is_playing', False),
        'progress_ms': playback_data.get('progress_ms', 0),
        'timestamp': playback_data.get('timestamp', 0),
        'item': {
            'id': track_info['id'],
            'name': track_info['name'],
            'duration_ms': track_info['duration_ms'],
            'popularity': track_info.get('popularity', 0),
            'external_urls': track_info['external_urls'],
            'artists': [
                {'id': artist['id'], 'name': artist['name']}
                for artist in track_info['artists']
            ],
            'album': {
                'id': album_info['id'],
                'name': album_info['name'],
                'album_type': album_info.get('album_type'),
                'total_tracks': album_info.get('total_tracks'),
                'images': album_info['images'],
                'external_urls': album_info['external_urls'],
                'release_date': album_info.get('release_date'),
                'release_date_precision': album_info.get('release_date_precision')
            },
            'audioFeatures': audio_features,
            'artistGenres': [genre for artist in artists_data for genre in artist.get('genres', [])]
        }
    }

@csrf_exempt
@require_http_methods(["POST"])
def get_current_playback(request):
    try:
        data = json.loads(request.body)
        token = data.get('token')
        
        if not token:
            return JsonResponse({'error': 'Token is required'}, status=400)
        
        analyzer = SpotifyAnalyzer(token)
        
        playback_url = 'https://api.spotify.com/v1/me/player'
        playback_data = analyzer._make_request(playback_url)
        
        if not playback_data or not playback_data.get('item'):
            return JsonResponse({'item': None}, status=200)
        
        extracted_data = _extract_playback_data(playback_data)
        
        audio_features_url = f'https://api.spotify.com/v1/audio-features/{extracted_data["track_id"]}'
        audio_features = analyzer._make_request(audio_features_url)
        
        artists_data = analyzer._fetch_artist_genres_batched(extracted_data['artist_ids'])
        
        essential_playback = _build_essential_playback_response(
            playback_data, audio_features or {}, artists_data
        )
        
        return JsonResponse(essential_playback, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in get_current_playback: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def _extract_essential_playlist_data(playlist: dict) -> dict:
    return {
        'id': playlist['id'],
        'name': playlist['name'],
        'description': playlist.get('description', ''),
        'images': playlist['images'],
        'external_urls': playlist['external_urls'],
        'tracks': {'total': playlist['tracks']['total']},
        'owner': {'display_name': playlist['owner']['display_name']},
        'public': playlist.get('public', False),
        'collaborative': playlist.get('collaborative', False)
    }

@csrf_exempt
@require_http_methods(["POST"])
def get_playlists(request):
    try:
        data = json.loads(request.body)
        token = data.get('token')
        
        if not token:
            return JsonResponse({'error': 'Token is required'}, status=400)
        
        analyzer = SpotifyAnalyzer(token)
        playlists_url = 'https://api.spotify.com/v1/me/playlists?limit=50'
        raw_playlists = analyzer._fetch_all_pages(playlists_url)
        
        essential_playlists = [
            _extract_essential_playlist_data(playlist) 
            for playlist in raw_playlists
        ]
        
        return JsonResponse({'data': essential_playlists}, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in get_playlists: {e}")
        return JsonResponse({'error': str(e)}, status=500)
