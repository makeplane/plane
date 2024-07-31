# Python imports
import os
from enum import Enum

# Third party imports
from openai import OpenAI
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.license.utils.instance_value import get_configuration_value
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import WorkspaceEntityPermission


class Task(Enum):
    PARAPHRASE = "PARAPHRASE"
    SIMPLIFY = "SIMPLIFY"
    ELABORATE = "ELABORATE"
    SUMMARIZE = "SUMMARIZE"
    GET_TITLE = "GET_TITLE"
    TONE = "TONE"


class Tone(Enum):
    CASUAL = "CASUAL"
    FORMAL = "FORMAL"


class RephraseGrammarEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    # Function to get system prompt based on task
    def get_system_prompt(task, tone=None):
        if task == Task.PARAPHRASE:
            return """
            Correct the grammar of the following text, strictly following these instructions:
            1. Ensure the new text is grammatically correct.
            2. Maintain the original meaning of the text.
            3. Keep the same person in the text. First person remains first person, etc. If no person is mentioned, keep it the same as in the input text, whether third person or neutral.
            4. Do not provide any unrelated data apart from the grammatically correct original text.
            """

        elif task == Task.SIMPLIFY:
            return """
            Simplify the following text, strictly adhering to these guidelines:
            1. Make the text more concise without losing its core meaning.
            2. Remove unnecessary words and phrases.
            3. Break down complex sentences into simpler ones.
            4. Use simpler vocabulary where appropriate, without changing the overall tone.
            5. Ensure the simplified text is still grammatically correct.
            6. Do not add any new information not present in the original text.
            """

        elif task == Task.ELABORATE:
            return """
            Elaborate on the following text, carefully following these instructions:
            1. Add relevant details, examples, or explanations to enrich the content.
            2. Expand on the main ideas while maintaining the original meaning and tone.
            3. Provide context where needed to enhance understanding.
            4. Ensure that your elaborations flow naturally with the existing text.
            5. Keep the overall structure and key points of the original text intact.
            6. Do not contradict any information in the original text.
            """

        elif task == Task.SUMMARIZE:
            return """
            Summarize the following text, strictly adhering to these guidelines:
            1. Condense the text into a highly concise summary that is approximately 10-15 percent of the length of the input text.
            2. Capture only the most essential information and main ideas.
            3. Use clear, straightforward language.
            4. Avoid detailed examples or minor points.
            5. Maintain the original tone and perspective of the text.
            6. Do not introduce any new information not present in the original text.
            7. Ensure the summary provides a quick, easily digestible overview of the text's content.
            8. If the input text is very short (less than 100 words), aim for a summary of 1-2 sentences.
            """

        elif task == Task.GET_TITLE:
            return """
            Generate an appropriate title for the following text, strictly following these instructions:
            1. Create a concise and engaging title that captures the main theme or purpose of the content.
            2. Ensure the title is relevant and accurately represents the text's subject matter.
            3. Make the title attention-grabbing while maintaining accuracy.
            4. Keep the title brief, ideally no more than 6-8 words.
            5. Do not include any information in the title that is not present in or implied by the text.
            6. If the text is clearly part of a larger work or series, reflect that in the title if appropriate.
            """

        elif task == Task.TONE:
            base_instructions = """
            Rewrite the following text in the specified tone, strictly adhering to these guidelines:

            1. Maintain the original meaning and key information of the text.
            2. Ensure the rewritten text is grammatically correct and coherent.
            3. Adapt the following elements to fit the desired tone:
            - Paragraph structure and length
            - Use of examples or anecdotes
            - Level of detail and explanation
            4. Consider the context and purpose of the text when adjusting the tone.
            5. Maintain consistency in tone throughout the entire text.
            6. Do not add or remove significant information from the original text.
            7. Adjust sentence structure and vocabulary to fit the desired tone without changing the core message.
            """

            if tone == Tone.CASUAL:
                return (
                    base_instructions
                    + """
                For a casual tone:
                1. Use conversational and everyday language.
                2. Incorporate contractions, colloquialisms, and common idioms.
                3. Use active voice predominantly.
                4. Employ simpler sentence structures.
                5. Use more common vocabulary and explain technical terms in lay terms.
                6. Incorporate personal experiences and relatable scenarios where appropriate from the input.
                7. Aim for a Flesch-Kincaid grade level of 6-8.
                """
                )
            elif tone == Tone.FORMAL:
                return (
                    base_instructions
                    + """
                For a formal tone:
                1. Use professional and academic language.
                2. Avoid contractions, colloquialisms, and idioms.
                3. Maintain a respectful, objective, and impersonal voice.
                4. Use passive voice where appropriate.
                5. Employ more complex sentence structures.
                6. Utilize precise vocabulary and technical terms when relevant.
                7. Focus on facts, data, and logical arguments.
                8. Maintain technical terms and provide context if necessary.
                9. Aim for a Flesch-Kincaid grade level of 11-12 or higher.
                """
                )
            else:
                return Response(
                    {"error": "Invalid tone. Must be 'formal' or 'casual'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                {"error": "Invalid task. Please provide a correct task name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def post(self, request, slug):
        # Get the task and text input
        task = request.data.get("task", "grammar_check")
        text_input = request.data.get("text_input", "")

        # tone may be formal or casual
        tone = request.data.get("tone") if task == "tone" else None

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
                {
                    "role": "system",
                    "content": self.get_system_prompt(task, tone),
                },
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
