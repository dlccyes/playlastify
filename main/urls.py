from django.urls import path

from . import views
from . import RequestController

urlpatterns = [
    path('', views.index, name='index'),
    path('request-token', RequestController.request_token),
    path('get-env', RequestController.get_env),
    path('lastfm-top-tracks', RequestController.get_lastfm_top_tracks),
    path('api/analyze-playlist', views.analyze_playlist, name='analyze_playlist'),
    path('api/current-playback', views.get_current_playback, name='current_playback'),
    path('api/playlists', views.get_playlists, name='playlists'),
]