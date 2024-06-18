import requests

# django rest framework
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response


class ProductsView(APIView):
    def list(self):
        response = requests.get()
        return Response("Hello World")
