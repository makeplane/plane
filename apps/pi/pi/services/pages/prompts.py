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
Summarize the following text according to these strict guidelines:

1. Condense the text into a clear summary that is **about 10-15 percent of the original length.**
2. Include **only the core points and main ideas**; exclude examples, anecdotes, and minor details.
3. Use **simple and direct language**; avoid technical jargon or unclear vocabulary unless it is necessary to understand the original meaning.
4. Maintain the **tone and intent** of the source.
5. Do **not introduce any new information**.
6. If the input is < 100 words, produce **1-2 concise sentences**.
7. Structure the summary with:
   - **Bullet points** (using <ul> and <li> tags) if there are multiple key ideas
   - **One short paragraph** (using <p> tag) if it is a single core concept
8. **Output valid HTML only.** Use appropriate HTML tags: <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis, <em> for italics.
9. Do not restate the prompt itself or preface the summary with meta commentary.
10. Exclude all image URLs, video URLs, and media links from your output.
11. Do not include anything related to the prompt itself or meta-commentary about your instructions.
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
5. Provide your response formatted in valid HTML only, using appropriate HTML tags for structure and readability.

Output Criteria
6. Provide a direct answer **first**, then explanations if needed.
7. When relevant, include:
   <ul>
     <li><strong>Summary of key points</strong></li>
     <li><strong>Structured lists</strong> (bullets or numbered) to improve readability</li>
     <li><strong>Relevant examples</strong> only if essential for clarity</li>
   </ul>
8. For code responses:
   <ul>
     <li>Use <code><pre></code> for blocks</li>
     <li>Provide brief comments where useful</li>
     <li>Ensure correctness and clarity</li>
   </ul>

Formatting Rules
9. Use the following HTML tags where they enhance understanding:
   <ul>
     <li><strong> for bold</li>
     <li><em> for italics</li>
     <li><ul>/<ol> for lists</li>
     <li><code> for inline code</li>
     <li><pre> for code blocks</li>
   </ul>

Communication Standards
10. Respect privacy and avoid sensationalism.
11. Do not include phrases like "Response:" or "Answer:" or meta-commentary about your instructions.
12. Avoid filler text; deliver content that directly addresses the request.
13. Exclude all image URLs, video URLs, and media links from your output.
14. Do not include anything related to the prompt itself or meta-commentary about your instructions.
"""

ELABORATE_PROMPT = """
You will receive a message with these sections:
- "Revision Request: elaborate"
- "Context:" (grounding source; do NOT rewrite this)
- "Current Content:" (this is what the user wants you to revise)

Task (elaborate):
1. Rewrite ONLY the "Current Content" by elaborating it.
2. Use the "Context" as grounding to add clarifications/details that are consistent with it.
3. Preserve the original meaning, tone, tense, and perspective of the current content.
4. Do not introduce new facts beyond what is supported by the context.
5. Exclude all image URLs, video URLs, and media links from your output.
6. Output valid HTML only (use <p>, <ul>, <li>, <strong>, <em> as needed). No markdown.
7. Do not include anything related to the prompt itself or meta-commentary about your instructions.
"""

SHORTEN_PROMPT = """
You will receive a message with these sections:
- "Revision Request: shorten"
- "Context:" (grounding source; do NOT rewrite this)
- "Current Content:" (this is what the user wants you to revise)

Task (shorten):
1. Rewrite ONLY the "Current Content" to be shorter and clearer.
2. Keep core meaning and key points; remove redundancy and filler.
3. Use the "Context" only to avoid contradictions; do not add new facts.
4. Preserve tone, tense, and perspective.
5. Exclude all image URLs, video URLs, and media links from your output.
6. Output valid HTML only (use <p>, <ul>, <li>, <strong>, <em> as needed). No markdown.
7. Do not include anything related to the prompt itself or meta-commentary about your instructions.
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
