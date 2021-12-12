from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from main.models import response_t
import main.helper
import requests
import base64
import json
import ast
from dotenv import load_dotenv
import os


def getEnv(request):
    load_dotenv()
    clientID = os.getenv('clientID')
    redirect_uri = os.getenv('redirect_uri')
    return JsonResponse({'clientID':clientID, 'redirect_uri':redirect_uri}, status=200)


def requestToken(request):
    load_dotenv()
    clientID = os.getenv('clientID')
    clientSecret = os.getenv('clientSecret')
    redirect_uri = os.getenv('redirect_uri')
    cred = f'{clientID}:{clientSecret}'
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
    useDB = int(request.GET.get('useDB'))
    name = request.GET.get('name')
    iterAll = int(request.GET.get('iterAll'))
    print(useDB, name, len(response_t.objects.filter(cat=name)))
    if(useDB): # return db record
        if(len(response_t.objects.filter(cat=name)) != 0):
            return JsonResponse({'data':ast.literal_eval(response_t.objects.get(cat=name).data)}, status = 200)
    url = request.GET.get('url')
    token = request.GET.get('token')
    if(iterAll): # do iterate all
        data = main.helper.iterateAll(url, token)
        if(name):
            if(len(response_t.objects.filter(cat=name)) != 0): # exist record
                db = response_t.objects.get(cat=name)
                db.data = data
                db.save()
            else: # no existing record
                db = response_t(cat = name, data = data, updated = timezone.now())
                db.save()
        return JsonResponse({'data':data}, status = 200)
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ token,
    }
    payload = {}
    response = requests.request("GET", url, headers=headers, data=payload)
    resJson = json.loads(response.text)
    if(name):
        if(len(response_t.objects.filter(cat=name)) != 0): # exist record
            db = response_t.objects.get(cat=name)
            db.data = resJson
            db.save()
        else: # no existing record
            db = response_t(cat = name, data = resJson, updated = timezone.now())
            db.save()
    return JsonResponse(resJson, status = 200)