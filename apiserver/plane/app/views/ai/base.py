# Python imports
import os
from enum import Enum


# Third party imports
from openai import OpenAI
from rest_framework.response import Response
from rest_framework import status

# Django imports

# Module imports
from ..base import BaseAPIView
from plane.app.permissions import (
    WorkspaceEntityPermission,
)
from plane.license.utils.instance_value import get_configuration_value


class Task(Enum):
    ASK_AI = "ASK_AI"


class AskAIEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get_system_prompt(self, task):
        if task == Task.ASK_AI.value:
            return (
                True,
                """
                You are an advanced AI assistant designed to provide optimal responses by integrating given context with your broad knowledge base. Your primary objectives are:

                1. Thoroughly analyze and understand the provided context, which may include context, specific questions, code snippets, or any relevant information.
                2. Treat the given context as a critical input, using it to inform and guide your response.
                3. Leverage your extensive knowledge to complement and enhance your understanding of the context and to provide comprehensive, accurate answers.
                4. Seamlessly blend insights from the given context with your general knowledge, ensuring a cohesive and informative response.
                5. Adapt your response style and depth based on the nature of the context and the question asked.
                6. When dealing with code or technical context, provide explanations or solutions that are directly relevant and technically sound.
                7. Maintain clarity and conciseness in your responses while ensuring they are complete and informative.
                8. Use appropriate HTML tags for formatting only when it enhances readability or structure of the response.
                9. Respect privacy and avoid sensationalism when addressing sensitive topics.

                Your goal is to deliver the most relevant, accurate, and helpful response possible, considering both the provided content and your broader understanding.
                """,
            )
        else:
            return False, {
                "error": "Invalid task. Please provide a correct task name."
            }

    def post(self, request, slug):
        task = request.data.get("task", "ASK_AI")
        context = request.data.get("context", "")
        user_prompt = request.data.get("text_input", "")

        if not context or not user_prompt:
            return Response(
                {"error": "Both context and user prompt are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        if not OPENAI_API_KEY or not GPT_ENGINE:
            return Response(
                {"error": "OpenAI API key and engine are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client = OpenAI(api_key=OPENAI_API_KEY)

        processed, system_prompt = self.get_system_prompt(task)
        if not processed:
            return Response(system_prompt, status=status.HTTP_400_BAD_REQUEST)

        try:
            completion = client.chat.completions.create(
                model=GPT_ENGINE,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"Context:\n\n{context}\n\nQuestion: {user_prompt}",
                    },
                ],
                temperature=0.1,
            )
            response = completion.choices[0].message.content.strip()
            return Response({"response": response}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
