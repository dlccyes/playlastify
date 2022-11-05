from django.urls import path

from . import views
from . import RequestController

urlpatterns = [
    path('', views.index, name='index'),
    path('requestToken', RequestController.request_token),
    path('spagett', RequestController.spagett),
    path('getEnv', RequestController.get_env),
]