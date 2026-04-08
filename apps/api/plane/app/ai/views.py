import os
import json
import anthropic
from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole, Function, FunctionParameters

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.ai.executor import execute_tool
from plane.app.ai.tools.registry import get_tools_schema, get_tools_schema_openai
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception

from plane.app.views.base import BaseAPIView

# Import tools to trigger registration
import plane.app.ai.tools  # noqa: F401

SYSTEM_PROMPT = """You are an AI assistant for a project management tool.
You help users manage their projects and tasks through natural language.
When the user asks to create, update, or list tasks/projects — use the available tools.
Always respond in the same language the user writes in.
Be concise and helpful.

IMPORTANT RULES:
- Never guess or invent IDs. All IDs (project_id, issue_id) are UUIDs.
- Every request starts fresh — you have NO memory of IDs from previous messages. UUIDs are never stored in chat history.
- Before ANY operation on a project: call list_projects to get project_id.
- Before ANY operation on an issue (update, set deadline, change description): call list_issues to get issue_id. Even if the issue was mentioned earlier in the conversation — call list_issues again.
- If the user says "the first task", "that issue", "it" — still call list_issues to find it, do not guess the ID.
- If the user mentions a date or deadline, always pass due_date to create_issue or update_issue — do not skip it."""


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

        if not api_key or provider_key.lower() not in ("anthropic", "gigachat"):
            return Response(
                {"error": "AI chat requires Anthropic or GigaChat provider to be configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        messages = request.data.get("messages", [])
        if not messages:
            return Response({"error": "messages are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            actions = []

            if provider_key.lower() == "anthropic":
                import httpx

                base_url = os.environ.get("ANTHROPIC_BASE_URL")
                client = anthropic.Anthropic(
                    api_key=api_key,
                    base_url=base_url,
                    http_client=httpx.Client(verify=False),
                )

                tools = get_tools_schema()

                response = client.messages.create(
                    model=model,
                    max_tokens=2048,
                    system=SYSTEM_PROMPT,
                    tools=tools,
                    messages=messages,
                )

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

            else:  # gigachat
                tools = get_tools_schema_openai()
                # Convert tools to GigaChat Function objects
                gc_functions = [
                    Function(
                        name=t["function"]["name"],
                        description=t["function"]["description"],
                        parameters=FunctionParameters(**t["function"]["parameters"]),
                    )
                    for t in tools
                ]

                # Build initial GigaChat messages: prepend system as first user message
                gc_messages = [Messages(role=MessagesRole.SYSTEM, content=SYSTEM_PROMPT)]
                for m in messages:
                    role = MessagesRole.USER if m["role"] == "user" else MessagesRole.ASSISTANT
                    gc_messages.append(Messages(role=role, content=m["content"]))

                with GigaChat(credentials=api_key, model=model, verify_ssl_certs=False) as client:
                    response = client.chat(Chat(messages=gc_messages, functions=gc_functions))

                    # Agentic loop
                    while response.choices[0].finish_reason == "function_call":
                        fn_call = response.choices[0].message.function_call
                        tool_args = json.loads(fn_call.arguments) if isinstance(fn_call.arguments, str) else fn_call.arguments
                        result = execute_tool(fn_call.name, tool_args, slug, request.user)
                        actions.append({"tool": fn_call.name, "result": _summarize(fn_call.name, result)})

                        gc_messages.append(response.choices[0].message)
                        gc_messages.append(
                            Messages(
                                role=MessagesRole.FUNCTION,
                                content=json.dumps(result, ensure_ascii=False),
                                name=fn_call.name,
                            )
                        )

                        response = client.chat(Chat(messages=gc_messages, functions=gc_functions))

                final_text = response.choices[0].message.content

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
