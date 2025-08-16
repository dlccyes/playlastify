from django.http import JsonResponse
import main.helper
import requests
import base64
import json
from dotenv import load_dotenv
import os


def get_env(request):
    load_dotenv()
    client_id = os.getenv('CLIENT_ID')
    redirect_uri = os.getenv('REDIRECT_URI')
    return JsonResponse({'clientID':client_id, 'redirect_uri':redirect_uri}, status=200)

def request_token(request):
    load_dotenv()
    client_id = os.getenv('CLIENT_ID')
    client_secret = os.getenv('CLIENT_SECRET')
    redirect_uri = os.getenv('REDIRECT_URI')
    cred = f'{client_id}:{client_secret}'
    b64_cred = base64.b64encode(cred.encode('ascii')).decode('ascii')
    auth = f'Basic {b64_cred}'
    url = "https://accounts.spotify.com/api/token"
    payload={
        'grant_type': 'authorization_code',
        'code': request.GET.get('code'),
        'redirect_uri': redirect_uri
    }
    headers = {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    return JsonResponse({'data':json.loads(response.text)}, status = 200)

def spagett(request):
    try:
        iter_all = int(request.GET.get('iterAll', 0))
        url = request.GET.get('url')
        token = request.GET.get('token')
        
        if not url or not token:
            return JsonResponse({'error': 'Missing URL or token'}, status=400)
        
        if iter_all: # do iterate all
            data = main.helper.iterate_all(url, token)
            return JsonResponse({'data': data}, status=200)
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+ token,
        }
        payload = {}
        response = requests.request("GET", url, headers=headers, data=payload)
        
        if response.status_code != 200:
            return JsonResponse({'error': f'Spotify API error: {response.status_code}'}, status=response.status_code)
        
        if not response.text or response.text.strip() == '':
            return JsonResponse({'item': None}, status=200)
        
        res_json = json.loads(response.text)
        return JsonResponse(res_json, status=200)
        
    except Exception as e:
        print(f"Error in spagett: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def get_lastfm_top_tracks(request):
    load_dotenv()
    lastfm_api_key = os.getenv('LASTFM_API_KEY')
    
    if not lastfm_api_key:
        return JsonResponse({'error': 'Last.fm API key not configured'}, status=500)
    
    username = request.GET.get('username')
    period = request.GET.get('period', '7day')
    
    if not username:
        return JsonResponse({'error': 'Username is required'}, status=400)
    
    try:
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
                    'api_key': lastfm_api_key,
                    'format': 'json'
                },
                timeout=10
            )
            
            if response.status_code != 200:
                return JsonResponse({'error': f'Last.fm API error: {response.status_code}'}, status=response.status_code)
            
            data = response.json()
            
            if not data.get('toptracks') or data['toptracks']['@attr']['totalPages'] == '0':
                return JsonResponse({'error': 'No scrobbles found for this period'}, status=404)
            
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
        
        return JsonResponse({'data': tracks_count}, status=200)
        
    except Exception as e:
        print(f"Error in get_lastfm_top_tracks: {e}")
        return JsonResponse({'error': str(e)}, status=500)
