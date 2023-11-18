# Python imports
import requests

# Third party imports
from openai import OpenAI
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
from plane.license.models import InstanceConfiguration
from plane.license.utils.instance_value import get_configuration_value

class GPTIntegrationEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def post(self, request, slug, project_id):

        # Get the configuration value
        instance_configuration = InstanceConfiguration.objects.values("key", "value")
        api_key = get_configuration_value(instance_configuration, "OPENAI_API_KEY")
        gpt_engine = get_configuration_value(instance_configuration, "GPT_ENGINE")

        # Check the keys
        if not api_key or not gpt_engine:
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

        instance_configuration = InstanceConfiguration.objects.values("key", "value")
        
        gpt_engine = get_configuration_value(instance_configuration, "GPT_ENGINE")

        client = OpenAI(
            api_key=api_key,
        )

        response = client.chat.completions.create(
            model=gpt_engine,
            messages=[{"role": "user", "content": final_text}],
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


class ReleaseNotesEndpoint(BaseAPIView):
    def get(self, request):
        release_notes = get_release_notes()
        return Response(release_notes, status=status.HTTP_200_OK)


class UnsplashEndpoint(BaseAPIView):

    def get(self, request):
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
        return Response(resp.json(), status=resp.status_code)
