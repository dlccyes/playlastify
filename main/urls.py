from django.urls import path

from . import views
from . import RequestController

urlpatterns = [
    path('', views.index, name='index'),
    path('requestToken', RequestController.requestToken),
    path('spagett', RequestController.spagett),
    path('getEnv', RequestController.getEnv),
]