from django.http import JsonResponse
import main.helper
import requests
import base64
import json
from dotenv import load_dotenv
import os


def get_env():
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
    iter_all = int(request.GET.get('iterAll'))
    url = request.GET.get('url')
    token = request.GET.get('token')
    if iter_all: # do iterate all
        data = main.helper.iterateAll(url, token)
        return JsonResponse({'data':data}, status = 200)
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ token,
    }
    payload = {}
    response = requests.request("GET", url, headers=headers, data=payload)
    
    if response.text == None or response.text == '':
        return JsonResponse({'item':None}, status = 200)
    
    res_json = json.loads(response.text)
    
    return JsonResponse(res_json, status = 200)
