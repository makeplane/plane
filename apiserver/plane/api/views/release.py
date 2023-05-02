# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from .base import BaseAPIView
from plane.utils.integrations.github import get_release_notes


class ReleaseNotesEndpoint(BaseAPIView):
    def get(self, request):
        try:
            release_notes = get_release_notes()
            return Response(release_notes, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
