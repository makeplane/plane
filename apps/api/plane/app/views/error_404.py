# views.py
from django.http import JsonResponse


def custom_404_view(request, exception=None):
    return JsonResponse({"error": "Page not found."}, status=404)
