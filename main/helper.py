from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from main.models import response_t
import requests
import base64
import json

def iterateAll(next_url, token):
    temp = []
    continuue = True
    headers={
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
        resJson = json.loads(response.text)
        temp += resJson['items']
        if(resJson['next']):
            next_url = resJson['next']
        else:
            continuue = False
    return temp