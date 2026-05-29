"""
AI-powered email summarization for Support Ticket creation.

Reuses the existing LLM infrastructure (get_llm_config / get_llm_response)
configured in Plane's god-mode settings.
"""

import logging
import re

from plane.app.views.external.base import get_llm_config, get_llm_response
from plane.utils.html_processor import strip_tags

logger = logging.getLogger("plane")

# Maximum characters of raw body to send to the LLM
_MAX_BODY_FOR_LLM = 4000

# Maximum characters for plain-text fallback
_MAX_FALLBACK_LENGTH = 1500

_SUMMARY_PROMPT = """You are a support ticket triage assistant.

Summarize the following email body into a concise support ticket description.
Use ONLY the sections below — omit any section if the email does not contain
enough information for it. Do not invent information.

Problem Summary:
Impact:
Requested Action:

Rules:
- Be concise (3-5 sentences total).
- Strip email signatures, disclaimers, legal footers, and forwarded headers.
- Do not include greetings or sign-offs.
- Output plain text only, no markdown.
"""


def _clean_email_body(body_text: str) -> str:
    """Remove common email artifacts: signatures, disclaimers, forwarded headers."""
    # Remove lines starting with ">" (quoted replies)
    lines = body_text.splitlines()
    cleaned = []
    for line in lines:
        stripped = line.strip()
        # Skip quoted reply lines
        if stripped.startswith(">"):
            continue
        # Stop at common signature markers
        if stripped in ("--", "---", "— "):
            break
        if re.match(
            r"^(Sent from|Get Outlook|CONFIDENTIAL|DISCLAIMER|This email)",
            stripped,
            re.IGNORECASE,
        ):
            break
        cleaned.append(line)
    return "\n".join(cleaned).strip()


def generate_ticket_description_from_email(body_text: str) -> tuple[str, bool]:
    """
    Generate an AI-summarized support ticket description from an email body.

    Returns:
        (description_html, used_ai) — the HTML description and whether AI was used.
    """
    if not body_text or not body_text.strip():
        return "<p>No content</p>", False

    cleaned = _clean_email_body(body_text)
    if not cleaned:
        cleaned = body_text[:_MAX_FALLBACK_LENGTH]

    # Try AI summarization
    try:
        api_key, model, provider = get_llm_config()
        if api_key and model and provider:
            truncated = cleaned[:_MAX_BODY_FOR_LLM]
            text, error = get_llm_response(
                _SUMMARY_PROMPT, truncated, api_key, model, provider
            )
            if text and not error:
                # Convert newlines to <br/> for HTML display
                summary_html = "<p>" + text.strip().replace("\n", "<br/>") + "</p>"
                logger.info("AI summary generated successfully")
                return summary_html, True
            else:
                logger.warning(
                    "AI summary failed, falling back to plain text: %s",
                    error or "empty response",
                )
        else:
            logger.info(
                "LLM not configured (no API key/model/provider), using plain-text fallback"
            )
    except Exception as e:
        logger.warning("AI summary exception, falling back to plain text: %s", e)

    # Fallback: cleaned, truncated plain text
    fallback = cleaned[:_MAX_FALLBACK_LENGTH]
    return f"<p>{fallback}</p>", False
