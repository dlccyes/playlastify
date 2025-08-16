from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.
def index(request):
    return render(request, 'index.html')

def test_view(request):
    return JsonResponse({'message': 'Test view working!'}, status=200)
