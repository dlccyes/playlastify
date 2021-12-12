from django.shortcuts import render
import requests
import base64

# Create your views here.
def index(request):
    return render(request, 'index.html')

def getToken(request):
    clientID = '01f12efd21c64c08838af6608650bac1'
    clientSecret = '6ee5b34e208d4a89b61628a3c8f9347c'
    message = f'base {clientID}:{clientSecret}'
    message_bytes = message.encode('ascii')
    base64_bytes = base64.b64encode(message_bytes)
    base64_message = base64_bytes.decode('ascii')
    url = "https://accounts.spotify.com/api/token?grant_type='client_credentials'"

    payload={}
    headers = {
      'Authorization': base64_message
    }

    response = requests.request("GET", url, headers=headers, data=payload)

    print(response.text)
    return(response.text)