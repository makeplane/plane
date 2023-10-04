# Python imports
import requests

# Third party imports
import openai
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from sentry_sdk import capture_exception

# Django imports
from django.conf import settings

# Module imports
from .base import BaseAPIView
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import Workspace, Project
from plane.api.serializers import ProjectLiteSerializer, WorkspaceLiteSerializer
from plane.utils.integrations.github import get_release_notes


class GPTIntegrationEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id):
        try:
            if not settings.OPENAI_API_KEY or not settings.GPT_ENGINE:
                return Response(
                    {"error": "OpenAI API key and engine is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            prompt = request.data.get("prompt", False)
            task = request.data.get("task", False)

            if not task:
                return Response(
                    {"error": "Task is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            final_text = task + "\n" + prompt

            openai.api_key = settings.OPENAI_API_KEY
            response = openai.ChatCompletion.create(
                model=settings.GPT_ENGINE,
                messages=[{"role": "user", "content": final_text}],
                temperature=0.7,
                max_tokens=1024,
            )

            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id)

            text = response.choices[0].message.content.strip()
            text_html = text.replace("\n", "<br/>")
            return Response(
                {
                    "response": text,
                    "response_html": text_html,
                    "project_detail": ProjectLiteSerializer(project).data,
                    "workspace_detail": WorkspaceLiteSerializer(workspace).data,
                },
                status=status.HTTP_200_OK,
            )
        except (Workspace.DoesNotExist, Project.DoesNotExist) as e:
            return Response(
                {"error": "Workspace or Project Does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


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


class UnsplashEndpoint(BaseAPIView):

    def get(self, request):
        try:
            query = request.GET.get("query", False)
            page = request.GET.get("page", 1)
            per_page = request.GET.get("per_page", 20)

            url = (
                f"https://api.unsplash.com/search/photos/?client_id={settings.UNSPLASH_ACCESS_KEY}&query={query}&page=${page}&per_page={per_page}"
                if query
                else f"https://api.unsplash.com/photos/?client_id={settings.UNSPLASH_ACCESS_KEY}&page={page}&per_page={per_page}"
            )

            headers = {
                "Content-Type": "application/json",
            }

            resp = requests.get(url=url, headers=headers)
            return Response(resp.json(), status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
