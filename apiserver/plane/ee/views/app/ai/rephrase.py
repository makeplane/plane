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
    ASK_AI = "ASK_AI"


class RephraseGrammarEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    # Function to get system prompt based on task
    def get_system_prompt(self, task, casual_score=5, formal_score=5):
        format_instructions = """
        Strictly follow these instructions for formatting the response:
            1. Preserve all HTML tags and formatting present in the input text, where applicable.
            2. RETURN ONLY the response text with the original HTML structure intact, where applicable.
            3. Do not include any explanations, comments, or additional text in your response.
            4. Do not add any prefixes or suffixes (such as "Question:" or "Answer:" or "Content:") to your response.
            5. If there are cases where input doesn't seem to be absolutely coherent or meaningful where you can't perform the intended task just provide the input back without any additional text and explanations.
            """
        if task == Task.PARAPHRASE.value:
            return (
                True,
                """
        Correct the grammar and spelling of the following text, adhering strictly to these instructions:
        1. Fix all grammatical and spelling errors in the text.
        2. Preserve the original meaning, tone, and intent of the text.
        3. Maintain the original perspective and pronouns. Do not change from third person to first person or vice versa.
        4. Keep the same tense, unless it's grammatically incorrect in context.
        5. Do not add, remove, or alter any information beyond grammatical and spelling corrections.
        6. If the original text uses incorrect pronouns (e.g., "women" instead of "woman"), correct them while maintaining the original subject.
        """
                + format_instructions,
            )

        elif task == Task.SIMPLIFY.value:
            return (
                True,
                """
        Simplify the following text while adhering strictly to these guidelines:
        1. Make the text more concise without losing its core meaning.
        2. Remove unnecessary words and phrases.
        3. Break down complex sentences into simpler ones.
        4. Use simpler vocabulary where appropriate, without changing the overall tone.
        5. Ensure the simplified text is still grammatically correct.
        6. Do not add any new information not present in the original text.
        7. Maintain the original perspective (e.g., first person, third person).
        8. Keep the same tense unless it's grammatically incorrect in context.
        """
                + format_instructions,
            )

        elif task == Task.ELABORATE.value:
            return (
                True,
                """
        Elaborate on the following text by carefully following these instructions:
        1. Add relevant details, examples, or explanations to enrich the content.
        2. Expand on the main ideas while maintaining the original meaning and tone.
        3. Provide context where needed to enhance understanding.
        4. Ensure that your elaborations flow naturally with the existing text.
        5. Keep the overall structure and key points of the original text intact.
        6. Do not contradict any information in the original text.
        7. Maintain the original perspective (e.g., first person, third person).
        """
                + format_instructions,
            )

        elif task == Task.SUMMARIZE.value:
            return (
                True,
                """
        Summarize the following text by strictly adhering to these guidelines:
        1. Condense the text into a highly concise summary that is approximately 10-15 percent of the length of the input text.
        2. Capture only the most essential information and main ideas.
        3. Use clear, straightforward language.
        4. Avoid detailed examples or minor points.
        5. Maintain the original tone and perspective of the text.
        6. Do not introduce any new information not present in the original text.
        7. Ensure the summary provides a quick, easily digestible overview of the text's content.
        8. If the input text is very short (less than 100 words), aim for a summary of 1-2 sentences.
        """
                + format_instructions,
            )

        elif task == Task.GET_TITLE.value:
            return (
                True,
                """
        Generate an appropriate title for the following text, strictly following these instructions:
        1. Create a concise and engaging title that captures the main theme or purpose of the content.
        2. Ensure the title is relevant and accurately represents the text's subject matter.
        3. Make the title attention-grabbing while maintaining accuracy.
        4. Keep the title brief, ideally no more than 6-8 words.
        5. Do not include any information in the title that is not present in or implied by the text.
        6. If the text is clearly part of a larger work or series, reflect that in the title if appropriate.
        7. Return ONLY the generated title, without any quotation marks, explanations, or additional text.
        """
                + format_instructions,
            )

        elif task == Task.TONE.value:
            base_instructions = """
            Rewrite the following text according to the specified readability score and return the output in the same structure as the input, changing only the text. Strictly adhere to these guidelines:

            1. Maintain the original meaning and key information of the text.
            2. Ensure the rewritten text is grammatically correct and coherent.
            3. Consider the context and purpose of the text when adjusting the tone.
            4. Maintain consistency in style throughout the entire text.
            5. Do not add or remove significant information from the original text.
            6. Adjust the structure and length as needed to match the tone.
            """
            tone_specific_instructions = {
                (10, 0): """
                Extremely Casual
                1. Use the simplest, most conversational language possible.
                2. Write as if speaking to a close friend or family member.
                3. Use lots of contractions, slang, and colloquialisms.
                4. Keep sentences very short and simple.
                5. Use active voice exclusively.
                6. Explain complex ideas using everyday analogies and examples.
                7. Address the reader directly and use a very friendly, personal tone.
                8. Use emotive language and exclamations where appropriate.
                """,
                (9, 1): """
                Very Casual
                1. Use simple, conversational language.
                2. Include contractions and some common colloquialisms.
                3. Keep sentences short and straightforward.
                4. Use mostly active voice.
                5. Explain any technical terms in simple language.
                6. Address the reader directly in a friendly manner.
                7. Use a personal, engaging tone throughout.
                """,
                (8, 2): """
                Casual
                1. Use everyday language with some more complex words.
                2. Mix short and medium-length sentences.
                3. Use contractions frequently.
                4. Incorporate some idiomatic expressions.
                5. Maintain a friendly, approachable tone.
                6. Use personal pronouns and address the reader directly.
                7. Simplify complex ideas but retain some field-specific terms with explanations.
                """,
                (7, 3): """
                Somewhat Casual
                1. Balance everyday language with more sophisticated vocabulary.
                2. Use a mix of simple and complex sentences.
                3. Include contractions in most cases.
                4. Maintain a friendly tone while introducing some more formal elements.
                5. Use mostly active voice, but include some passive constructions.
                6. Explain technical terms, but use them where appropriate.
                7. Address the reader directly, but less frequently than in more casual styles.
                """,
                (6, 4): """
                Neutral Leaning Casual
                1. Use a balanced mix of casual and formal language.
                2. Construct sentences of varying complexity.
                3. Use contractions in some cases, but not always.
                4. Maintain a friendly yet professional tone.
                5. Include technical terms where necessary, with brief explanations.
                6. Use a mix of active and passive voice.
                7. Address the reader directly occasionally, but not consistently.
                """,
                (5, 5): """
                Neutral
                1. Strike a perfect balance between casual and formal language.
                2. Use a varied vocabulary that includes both common and more sophisticated words.
                3. Construct sentences of mixed complexity.
                4. Use contractions sparingly.
                5. Maintain a tone that is neither overly friendly nor too formal.
                6. Include technical terms where appropriate, with explanations when necessary.
                7. Balance active and passive voice equally.
                8. Address the reader directly only when it serves a clear purpose.
                """,
                (4, 6): """
                Neutral Leaning Formal
                1. Use more sophisticated vocabulary, but keep some casual elements.
                2. Construct mostly complex sentences with some simpler ones for balance.
                3. Use contractions occasionally, but prefer full forms.
                4. Maintain a professional tone with hints of friendliness.
                5. Incorporate field-specific terminology with brief explanations.
                6. Use more passive voice constructions.
                7. Address the reader directly only when necessary for clarity or emphasis.
                """,
                (3, 7): """
                Somewhat Formal
                1. Use more advanced vocabulary and complex sentence structures.
                2. Minimize use of contractions.
                3. Maintain a professional and objective tone.
                4. Incorporate field-specific terminology freely, explaining only the most complex terms.
                5. Use passive voice more frequently.
                6. Avoid directly addressing the reader unless absolutely necessary.
                7. Present information in a more detached, analytical manner.
                """,
                (2, 8): """
                Formal
                1. Use sophisticated vocabulary and complex sentence structures.
                2. Avoid contractions entirely.
                3. Maintain a highly professional and objective tone.
                4. Use field-specific terminology without explanation, unless extremely specialized.
                5. Prefer passive voice in most cases.
                6. Never address the reader directly.
                7. Present information in a scholarly, analytical manner.
                """,
                (1, 9): """
                Very Formal
                1. Use advanced, academic vocabulary and intricate sentence structures.
                2. Construct complex, multi-clause sentences.
                3. Maintain a strictly professional, detached tone.
                4. Use extensive field-specific terminology and concepts.
                5. Employ passive voice predominantly.
                6. Present information in a highly analytical and abstract manner.
                7. Use impersonal constructions throughout.
                """,
                (0, 10): """
                Extremely Formal
                1. Use the most advanced, scholarly vocabulary possible.
                2. Construct highly complex, multi-layered sentences.
                3. Maintain an extremely formal, impersonal tone throughout.
                4. Use the most specialized terminology and abstract concepts without explanation.
                5. Use passive voice and impersonal constructions almost exclusively.
                6. Present information in the most academic, theoretical manner possible.
                7. Avoid any hint of casualness or personal address.
                """,
            }

            return True, base_instructions + tone_specific_instructions.get(
                (casual_score, formal_score)
            ) + format_instructions

        elif task == Task.ASK_AI.value:
            return (
                True,
                """
        You are an advanced AI assistant designed to provide optimal responses by integrating given context with your broad knowledge base. Your primary objectives are:
        1. Thoroughly analyze and understand the provided content, which may include context, specific questions, code snippets, or any relevant information.
        2. Treat the given content as a critical input, using it to inform and guide your response.
        3. Leverage your extensive knowledge to complement and enhance your understanding of the content and to provide comprehensive, accurate answers.
        4. Seamlessly blend insights from the given content with your general knowledge, ensuring a cohesive and informative response.
        5. Adapt your response style and depth based on the nature of the content and the question asked.
        6. When dealing with code or technical content, provide explanations or solutions that are directly relevant and technically sound.
        7. Maintain clarity and conciseness in your responses while ensuring they are complete and informative.
        8. Use appropriate HTML tags for formatting where it enhances readability or structure of the response. Specifically:
            - Use <strong> tags for bold text instead of Markdown asterisks.
            - Use <em> tags for italicized text instead of Markdown underscores.
            - Use <ul> and <li> tags for unordered lists.
            - Use <ol> and <li> tags for ordered lists.
            - Use <code> tags for inline code.
            - Use <pre> tags for code blocks.
        9. Respect privacy and avoid sensationalism when addressing sensitive topics.
        10. Provide DIRECT answers without introductory phrases or explanations of your role.
        11. Do not include any prefixes (such as "Answer:" or "Response:") in your response.
        Your goal is to deliver the most relevant, accurate, and helpful response possible, considering both the provided content and your broader understanding.
        """,
            )

        else:
            return False, {"error": "Invalid task. Please provide a correct task name."}

    def post(self, request, slug):
        # Get the task
        task = request.data.get("task", "grammar_check")

        if task == Task.ASK_AI.value:
            context = request.data.get("text_input", "")
            user_prompt = request.data.get("query", "")

            # Check inputs
            if not context or not user_prompt:
                return Response(
                    {"error": "Query and text input are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            text_input = f"Context:\n\n{context}\n\nQuestion: {user_prompt}"
        else:
            text_input = request.data.get("text_input", "")

            # Check inputs
            if not text_input:
                return Response(
                    {"error": "Text input is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Get casual and formal scores for the tone task
        casual_score = int(request.data.get("casual_score", 5))
        formal_score = int(request.data.get("formal_score", 5))

        # Check the scores (only for TONE task)
        if task == Task.TONE.value:
            if (
                casual_score + formal_score != 10
                or casual_score < 0
                or formal_score < 0
            ):
                return Response(
                    {
                        "error": "Invalid scores. casual_score and formal_score must sum to 10 and both must be non-negative."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Get the configuration value
        LLM_API_KEY, LLM_MODEL = get_configuration_value(
            [
                {
                    "key": "LLM_API_KEY",
                    "default": os.environ.get("LLM_API_KEY", None),
                },
                {
                    "key": "LLM_MODEL",
                    "default": os.environ.get("LLM_MODEL", "gpt-4o-mini"),
                },
            ]
        )

        # Check the keys
        if not LLM_API_KEY or not LLM_MODEL:
            return Response(
                {"error": "OpenAI API key and engine are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the message list
        message_list = [{"role": "user", "content": text_input}]

        # Create the client
        client = OpenAI(api_key=LLM_API_KEY)

        processed, response = self.get_system_prompt(task, casual_score, formal_score)

        # If error
        if not processed:
            return Response(response, status=status.HTTP_400_BAD_REQUEST)

        # Create the completion
        completion = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "system", "content": response}, *message_list],
            temperature=0.1,
        )

        # Get the response
        response = completion.choices[0].message.content.strip()

        return Response({"response": response}, status=status.HTTP_200_OK)
