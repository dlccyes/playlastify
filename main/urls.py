from django.urls import path

from . import views
from . import RequestController

urlpatterns = [
    path('', views.index, name='index'),
    path('request-token', RequestController.request_token),
    path('spagett', RequestController.spagett),
    path('get-env', RequestController.get_env),
    path('lastfm-top-tracks', RequestController.get_lastfm_top_tracks),
]