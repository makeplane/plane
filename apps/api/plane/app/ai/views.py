import os
import anthropic

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.ai.executor import execute_tool
from plane.app.ai.tools.registry import get_tools_schema
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception

from plane.app.views.base import BaseAPIView

# Import tools to trigger registration
import plane.app.ai.tools  # noqa: F401

SYSTEM_PROMPT = """You are an AI assistant for a project management tool.
You help users manage their projects and tasks through natural language.
When the user asks to create, update, or list tasks/projects — use the available tools.
Always respond in the same language the user writes in.
Be concise and helpful."""


class AIChatEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        api_key, provider_key, model = get_configuration_value(
            [
                {"key": "LLM_API_KEY", "default": os.environ.get("LLM_API_KEY")},
                {"key": "LLM_PROVIDER", "default": os.environ.get("LLM_PROVIDER", "openai")},
                {"key": "LLM_MODEL", "default": os.environ.get("LLM_MODEL")},
            ]
        )

        if not api_key or provider_key.lower() != "anthropic":
            return Response(
                {"error": "AI chat requires Anthropic provider to be configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        messages = request.data.get("messages", [])
        if not messages:
            return Response({"error": "messages are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import httpx

            base_url = os.environ.get("ANTHROPIC_BASE_URL")
            client = anthropic.Anthropic(
                api_key=api_key,
                base_url=base_url,
                http_client=httpx.Client(verify=False),
            )

            tools = get_tools_schema()
            actions = []

            response = client.messages.create(
                model=model,
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                tools=tools,
                messages=messages,
            )

            # Agentic loop: keep executing tools until model stops
            while response.stop_reason == "tool_use":
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = execute_tool(block.name, block.input, slug, request.user)
                        actions.append({"tool": block.name, "result": _summarize(block.name, result)})
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result),
                        })

                messages = [
                    *messages,
                    {"role": "assistant", "content": response.content},
                    {"role": "user", "content": tool_results},
                ]

                response = client.messages.create(
                    model=model,
                    max_tokens=2048,
                    system=SYSTEM_PROMPT,
                    tools=tools,
                    messages=messages,
                )

            final_text = next(
                (block.text for block in response.content if hasattr(block, "text")), ""
            )

            return Response({"response": final_text, "actions": actions}, status=status.HTTP_200_OK)

        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "An error occurred while processing your request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def _summarize(tool_name: str, result: dict) -> str:
    if "error" in result:
        return f"Error: {result['error']}"
    if "message" in result:
        return result["message"]
    if "issues" in result:
        return f"Found {len(result['issues'])} issues"
    if "projects" in result:
        return f"Found {len(result['projects'])} projects"
    return "Done"
