import requests
import json

def iterate_all(next_url, token):
    temp = []
    continuue = True
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ token,
    }
    payload = {}
    fuse = 1
    while(continuue):
        fuse += 1
        if(fuse > 500):
            break
        response = requests.request("GET", next_url, headers=headers, data=payload)
        res_json = json.loads(response.text)
        temp += res_json['items']
        if(res_json['next']):
            next_url = res_json['next']
        else:
            continuue = False
    return temp