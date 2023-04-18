# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView


class ReleaseEndpoint(BaseAPIView):
    
    def get(self, request):
        try:
            

