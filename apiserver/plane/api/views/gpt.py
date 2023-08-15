# Python imports
import requests

# Third party imports
from rest_framework.response import Response
from rest_framework import status
import openai
from sentry_sdk import capture_exception

# Django imports
from django.conf import settings

# Module imports
from .base import BaseAPIView
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import Workspace, Project
from plane.api.serializers import ProjectLiteSerializer, WorkspaceLiteSerializer


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
            response = openai.Completion.create(
                model=settings.GPT_ENGINE,
                prompt=final_text,
                temperature=0.7,
                max_tokens=1024,
            )

            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id)

            text = response.choices[0].text.strip()
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
