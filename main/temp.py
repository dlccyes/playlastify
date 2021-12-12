from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
import requests
import base64

def getToken():
    clientID = '01f12efd21c64c08838af6608650bac1'
    clientSecret = '6ee5b34e208d4a89b61628a3c8f9347c'
    cred = f'{clientID}:{clientSecret}'
    message_bytes = cred.encode('ascii')
    base64_bytes = base64.b64encode(message_bytes)
    base64_message = base64_bytes.decode('ascii')
    message = f'Basic {base64_message}'
    url = "https://accounts.spotify.com/api/token"

    payload={
        'grant_type': 'client_credentials',
        'client_id': clientID
    }
    print(base64_message)
    headers = {
      'Authorization': message,
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    print(response.text)

getToken()
