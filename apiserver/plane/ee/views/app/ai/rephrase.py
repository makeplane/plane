# Python imports
import os

# Third party imports
from openai import OpenAI
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.license.utils.instance_value import get_configuration_value
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkspaceEntityPermission


class RephraseGrammarEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get_system_prompt(self, task):
        # Check the task type
        if task == "grammar_check":
            # System prompt for grammar check task
            system_prompt = """
            Correct the grammar of the following text, strictly following the instructions below:

            Instructions:
            1. Ensure the new text is grammatically correct.
            2. Maintain the original meaning of the text.
            3. Keep the same person in the text. First person remains first person, etc. If no person is mentioned, keep it the same as in the input text, whether third person or neutral.
            4. Do not provide any unrelated data apart from the grammatically correct original text.
            """
        else:
            # Empty system prompt for other tasks
            system_prompt = ""

        return system_prompt

    def post(self, request, slug):
        # Get the task and text input
        task = request.data.get("task", "grammar_check")
        text_input = request.data.get("text_input", "")

        # Check the text input
        if not text_input:
            return Response(
                {"error": "Text input is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the configuration value
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

        # Check the keys
        if not OPENAI_API_KEY or not GPT_ENGINE:
            return Response(
                {"error": "OpenAI API key and engine is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the message list
        message_list = [{"role": "user", "content": text_input}]

        # Create the client
        client = OpenAI(
            api_key=OPENAI_API_KEY,
        )

        # Create the completion
        completion = client.chat.completions.create(
            model=GPT_ENGINE,
            messages=[
                {"role": "system", "content": self.get_system_prompt(task)},
                *message_list,
            ],
            temperature=0.1,
        )

        # Get the response
        response = completion.choices[0].message.content.strip()

        return Response(
            {
                "response": response,
            },
            status=status.HTTP_200_OK,
        )
