# Python imports
import requests
import os

# Third party imports
from openai import OpenAI
from rest_framework.response import Response
from rest_framework import status

# Django imports

# Module imports
from ..base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace, Project
from plane.app.serializers import ProjectLiteSerializer, WorkspaceLiteSerializer
from plane.license.utils.instance_value import get_configuration_value


class GPTIntegrationEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        OPENAI_API_KEY, GPT_ENGINE = get_configuration_value(
            [
                {
                    "key": "OPENAI_API_KEY",
                    "default": os.environ.get("OPENAI_API_KEY", None),
                },
                {
                    "key": "GPT_ENGINE",
                    "default": os.environ.get("GPT_ENGINE", "gpt-3.5-turbo"),
                },
            ]
        )

        # Get the configuration value
        # Check the keys
        if not OPENAI_API_KEY or not GPT_ENGINE:
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

        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model=GPT_ENGINE, messages=[{"role": "user", "content": final_text}]
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


class WorkspaceGPTIntegrationEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        OPENAI_API_KEY, GPT_ENGINE = get_configuration_value(
            [
                {
                    "key": "OPENAI_API_KEY",
                    "default": os.environ.get("OPENAI_API_KEY", None),
                },
                {
                    "key": "GPT_ENGINE",
                    "default": os.environ.get("GPT_ENGINE", "gpt-3.5-turbo"),
                },
            ]
        )

        # Get the configuration value
        # Check the keys
        if not OPENAI_API_KEY or not GPT_ENGINE:
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

        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model=GPT_ENGINE, messages=[{"role": "user", "content": final_text}]
        )

        text = response.choices[0].message.content.strip()
        text_html = text.replace("\n", "<br/>")
        return Response(
            {"response": text, "response_html": text_html}, status=status.HTTP_200_OK
        )


class UnsplashEndpoint(BaseAPIView):
    def get(self, request):
        (UNSPLASH_ACCESS_KEY,) = get_configuration_value(
            [
                {
                    "key": "UNSPLASH_ACCESS_KEY",
                    "default": os.environ.get("UNSPLASH_ACCESS_KEY"),
                }
            ]
        )
        # Check unsplash access key
        if not UNSPLASH_ACCESS_KEY:
            return Response([], status=status.HTTP_200_OK)

        # Query parameters
        query = request.GET.get("query", False)
        page = request.GET.get("page", 1)
        per_page = request.GET.get("per_page", 20)

        url = (
            f"https://api.unsplash.com/search/photos/?client_id={UNSPLASH_ACCESS_KEY}&query={query}&page=${page}&per_page={per_page}"
            if query
            else f"https://api.unsplash.com/photos/?client_id={UNSPLASH_ACCESS_KEY}&page={page}&per_page={per_page}"
        )

        headers = {"Content-Type": "application/json"}

        resp = requests.get(url=url, headers=headers)
        return Response(resp.json(), status=resp.status_code)
