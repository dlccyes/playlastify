from django.http import JsonResponse
import requests
import base64
import json
from dotenv import load_dotenv
import os

def _load_environment_variables():
    load_dotenv()
    return {
        'client_id': os.getenv('CLIENT_ID'),
        'client_secret': os.getenv('CLIENT_SECRET'),
        'redirect_uri': os.getenv('REDIRECT_URI')
    }

def _create_spotify_auth_headers(client_id: str | None, client_secret: str | None) -> str:
    if not client_id or not client_secret:
        raise ValueError("Client ID and Client Secret are required")
    credentials = f'{client_id}:{client_secret}'
    encoded_credentials = base64.b64encode(credentials.encode('ascii')).decode('ascii')
    return f'Basic {encoded_credentials}'

def get_env(request):
    env_vars = _load_environment_variables()
    return JsonResponse({
        'clientID': env_vars['client_id'], 
        'redirect_uri': env_vars['redirect_uri']
    }, status=200)

def request_token(request):
    env_vars = _load_environment_variables()
    auth_header = _create_spotify_auth_headers(
        env_vars['client_id'], 
        env_vars['client_secret']
    )
    
    payload = {
        'grant_type': 'authorization_code',
        'code': request.GET.get('code'),
        'redirect_uri': env_vars['redirect_uri']
    }
    
    headers = {
        'Authorization': auth_header,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    response = requests.post("https://accounts.spotify.com/api/token", 
                           headers=headers, data=payload)
    return JsonResponse({'data': json.loads(response.text)}, status=200)

def _fetch_lastfm_tracks(username: str, period: str, api_key: str) -> dict:
    tracks_count = {}
    page = 1
    has_more_pages = True
    
    while has_more_pages:
        response = requests.get('https://ws.audioscrobbler.com/2.0/', 
            params={
                'method': 'user.gettoptracks',
                'user': username,
                'period': period,
                'page': page,
                'api_key': api_key,
                'format': 'json'
            },
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f'Last.fm API error: {response.status_code}')
        
        data = response.json()
        
        if not data.get('toptracks') or data['toptracks']['@attr']['totalPages'] == '0':
            raise Exception('No scrobbles found for this period')
        
        tracks = data['toptracks']['track']
        if not isinstance(tracks, list):
            tracks = [tracks]
            
        for track in tracks:
            title = f"{track['name']} - {track['artist']['name']}".lower()
            tracks_count[title] = int(track['playcount'])
        
        current_page = int(data['toptracks']['@attr']['page'])
        total_pages = int(data['toptracks']['@attr']['totalPages'])
        
        if current_page >= total_pages:
            has_more_pages = False
        else:
            page += 1
    
    return tracks_count

def get_lastfm_top_tracks(request):
    env_vars = _load_environment_variables()
    lastfm_api_key = os.getenv('LASTFM_API_KEY')
    
    if not lastfm_api_key:
        return JsonResponse({'error': 'Last.fm API key not configured'}, status=500)
    
    username = request.GET.get('username')
    period = request.GET.get('period', '7day')
    
    if not username:
        return JsonResponse({'error': 'Username is required'}, status=400)
    
    try:
        tracks_count = _fetch_lastfm_tracks(username, period, lastfm_api_key)
        return JsonResponse({'data': tracks_count}, status=200)
        
    except Exception as e:
        print(f"Error in get_lastfm_top_tracks: {e}")
        return JsonResponse({'error': str(e)}, status=500)
