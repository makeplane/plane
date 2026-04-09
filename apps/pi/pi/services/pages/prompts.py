# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Centralized prompts for all page-related AI features.

This file contains all LLM prompts used across page services.
To add a new feature, simply add your prompt here and reference it in your service class.
"""

# ============================================================================
# SUMMARIZATION PROMPTS
# ============================================================================

SUMMARY_PROMPT = """
Summarize the following text concisely, capturing only the main ideas and core points.

Guidelines:
1. Condense to roughly 10-15 percent of the original length.
2. Use simple, direct language. Preserve the tone and intent of the source.
3. Do not introduce new information, examples, or opinions.
4. If the input is under 100 words, respond in 1-2 concise sentences.

Formatting:
- Output valid Markdown only. Use standard Markdown syntax (e.g., **bold**, *italic*, bullet lists with -, numbered lists, headings with #).
- Structure the summary naturally based on the content — use paragraphs, bullet points, or a mix of both, whatever reads best.
- Do not include meta commentary, image/video URLs, or media links.
"""

# ============================================================================
# AI BLOCK PROMPTS
# ============================================================================

CUSTOM_PROMPT = """
You are a highly capable AI assistant. Using the provided context and any additional relevant knowledge:

1. Analyze the content deeply and accurately.
2. Use the provided context as the primary guiding information.
3. Augment the response only with verifiable, relevant knowledge you possess.
4. Respond in a clear, direct, and complete manner.
5. Provide your response formatted in valid Markdown only, using appropriate syntax for structure and readability.

--- Output Criteria ---
6. Provide a direct answer first, then explanations if needed.
7. When relevant, include a summary of key points, structured lists (bullets or numbered)
   for readability, and relevant examples only if essential for clarity.
8. For code, use fenced code blocks with a language identifier when helpful (```python ... ```)
   and backticks for inline code. Provide brief comments where useful and ensure correctness.
   Do not use HTML (no pre, code, or other tags).

--- Formatting Rules ---
9. Use standard Markdown syntax where it enhances understanding: **bold**, *italic*, - or 1. for
   lists, `inline code`, fenced code blocks, and # headings.
10. Structure the response naturally based on the content — use paragraphs, lists, headings,
    or a mix, whatever is most readable. Do not force a rigid structure.

--- Communication Standards ---
11. Respect privacy and avoid sensationalism.
12. Avoid filler text; deliver content that directly addresses the request.
13. Do not include meta-commentary, prefixes like "Response:" or "Answer:", image/video URLs, or media links.
"""

ELABORATE_PROMPT = """
You will receive a message with these sections:
- "Revision Request: elaborate"
- "Context:" (grounding source; do NOT rewrite this)
- "Current Content:" (this is what the user wants you to revise)

--- Task ---
1. Rewrite ONLY the "Current Content" by elaborating it.
2. Use the "Context" as grounding to add clarifications and details that are consistent with it.
3. Preserve the original meaning, tone, tense, and perspective of the current content.
4. Do not introduce new facts beyond what is supported by the context.
5. Expand on key points with additional depth, examples from context, or clearer explanations where it adds value.

--- Formatting ---
6. Output valid Markdown only. Use standard Markdown syntax (e.g., **bold**, *italic*, - or 1. for lists, # headings). No HTML.
7. Structure the elaborated content naturally — use paragraphs, lists, or a mix, whatever reads best for the expanded content.
8. Do not include meta-commentary, image/video URLs, or media links.
"""

SHORTEN_PROMPT = """
You will receive a message with these sections:
- "Revision Request: shorten"
- "Context:" (grounding source; do NOT rewrite this)
- "Current Content:" (this is what the user wants you to revise)

--- Task ---
1. Rewrite ONLY the "Current Content" to be shorter and clearer.
2. Keep core meaning and key points; remove redundancy, filler, and repetition.
3. Use the "Context" only to avoid contradictions; do not add new facts.
4. Preserve tone, tense, and perspective.
5. Prefer concise phrasing — combine related sentences, trim unnecessary qualifiers, and tighten language.

--- Formatting ---
6. Output valid Markdown only. Use standard Markdown syntax (e.g., **bold**, *italic*, - or 1. for lists, # headings). No HTML.
7. Structure the shortened content naturally — if the original used lists, keep lists;
   if paragraphs, keep paragraphs. Do not change the format unnecessarily.
8. Do not include meta-commentary, image/video URLs, or media links.
"""

# ============================================================================
# PROMPT REGISTRY
# ============================================================================
# This makes it easy to reference prompts by key

PROMPTS = {
    # Summarization
    "summarize": SUMMARY_PROMPT,
    # AI Blocks
    "custom_prompt": CUSTOM_PROMPT,
    "elaborate": ELABORATE_PROMPT,
    "shorten": SHORTEN_PROMPT,
}


def get_prompt(key: str) -> str:
    """
    Get a prompt by key.

    Args:
        key: Prompt key (e.g., "summarize", "custom_prompt", "elaborate", "shorten")

    Returns:
        Prompt string

    Raises:
        KeyError: If prompt key not found
    """
    if key not in PROMPTS:
        raise KeyError(f"Prompt '{key}' not found. Available prompts: {list(PROMPTS.keys())}")
    return PROMPTS[key]
