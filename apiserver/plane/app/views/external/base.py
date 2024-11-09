# Python import
import os

# Third party import
import litellm
import requests

from rest_framework import status
from rest_framework.response import Response

# Module import
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (ProjectLiteSerializer,
                                   WorkspaceLiteSerializer)
from plane.db.models import Project, Workspace
from plane.license.utils.instance_value import get_configuration_value

from ..base import BaseAPIView


def get_gpt_config():
    """Helper to get GPT configuration values"""
    OPENAI_API_KEY, GPT_ENGINE = get_configuration_value([
        {
            "key": "OPENAI_API_KEY",
            "default": os.environ.get("OPENAI_API_KEY", None),
        },
        {
            "key": "GPT_ENGINE", 
            "default": os.environ.get("GPT_ENGINE", "gpt-4o-mini"),
        },
    ])
    
    if not OPENAI_API_KEY or not GPT_ENGINE:
        return None, None
    return OPENAI_API_KEY, GPT_ENGINE


def get_gpt_response(task, prompt, api_key, engine):
    """Helper to get GPT completion response"""
    final_text = task + "\n" + prompt
    try:
        response = litellm.completion(
            model=engine,
            messages=[{"role": "user", "content": final_text}],
            api_key=api_key,
        )
        text = response.choices[0].message.content.strip()
        return text, None
    except Exception as e:
        return None, str(e)


class GPTIntegrationEndpoint(BaseAPIView):

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id):
        OPENAI_API_KEY, GPT_ENGINE = get_gpt_config()
        
        supported_models = ["gpt-4o-mini", "gpt-4o"]
        if GPT_ENGINE not in supported_models:
            return Response(
                {"error": f"Unsupported model. Please use one of: {', '.join(supported_models)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not OPENAI_API_KEY or not GPT_ENGINE:
            return Response(
                {"error": "OpenAI API key and engine is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = request.data.get("task", False)
        if not task:
            return Response(
                {"error": "Task is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        text, error = get_gpt_response(task, request.data.get("prompt", False), OPENAI_API_KEY, GPT_ENGINE)
        if not text and error:
            return Response(
                {"error": "An internal error has occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        workspace = Workspace.objects.get(slug=slug)
        project = Project.objects.get(pk=project_id)

        return Response(
            {
                "response": text,
                "response_html": text.replace("\n", "<br/>"),
                "project_detail": ProjectLiteSerializer(project).data,
                "workspace_detail": WorkspaceLiteSerializer(workspace).data,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceGPTIntegrationEndpoint(BaseAPIView):

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE"
    )
    def post(self, request, slug):
        OPENAI_API_KEY, GPT_ENGINE = get_gpt_config()
        
        if not OPENAI_API_KEY or not GPT_ENGINE:
            return Response(
                {"error": "OpenAI API key and engine is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = request.data.get("task", False)
        if not task:
            return Response(
                {"error": "Task is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        text, error = get_gpt_response(task, request.data.get("prompt", False), OPENAI_API_KEY, GPT_ENGINE)
        if not text and error:
            return Response(
                {"error": "An internal error has occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "response": text,
                "response_html": text.replace("\n", "<br/>"),
            },
            status=status.HTTP_200_OK,
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

        headers = {
            "Content-Type": "application/json",
        }

        resp = requests.get(url=url, headers=headers)
        return Response(resp.json(), status=resp.status_code)
