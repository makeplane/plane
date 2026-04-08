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
Registry-based extractor for embeddable content in chat answer markdown.

When a chat response is saved as a page, this module:
1. Scans for fenced code blocks whose tag matches a registered embed type.
2. Delegates parsing to the appropriate handler.
3. Replaces matched blocks with ``<div data-node-type="pi-utility-embed">`` HTML placeholders.
4. Returns the rewritten markdown plus a list of embed payloads ready for
   persistence.

To add a new embed type, write a handler function and register it in
``_EMBED_HANDLERS``.
"""

import json
import re
import uuid
from dataclasses import dataclass
from dataclasses import field
from typing import Any
from typing import Callable
from typing import Dict
from typing import List
from typing import Optional

from pi import logger

log = logger.getChild(__name__)

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class ExtractedEmbed:
    """A single embed extracted from the markdown."""

    embed_id: uuid.UUID
    embed_type: str
    sub_type: Optional[str]
    title: Optional[str]
    payload: Dict[str, Any]


@dataclass
class EmbedExtractionResult:
    """Result of extracting embeds from a markdown string."""

    rewritten_markdown: str
    embeds: List[ExtractedEmbed] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Chart handler
# ---------------------------------------------------------------------------


def _parse_chart_spec(raw_json: str) -> Optional[Dict[str, Any]]:
    """Attempt to parse a chart JSON spec. Returns None on failure."""
    try:
        spec = json.loads(raw_json.strip())
        if not isinstance(spec, dict):
            return None
        if "root" not in spec or "elements" not in spec:
            return None
        return spec
    except (json.JSONDecodeError, TypeError):
        return None


def _extract_chart_metadata(spec: Dict[str, Any]) -> tuple[str, Optional[str]]:
    """Extract chart sub_type and title from a parsed json-render spec."""
    elements = spec.get("elements", {})
    root_element = elements.get(spec.get("root", "root"), {})
    chart_type = root_element.get("type", "Unknown")
    title = root_element.get("props", {}).get("title")
    return chart_type, title


def _handle_chart_block(raw_content: str) -> Optional[ExtractedEmbed]:
    """Parse a ``chart`` fenced block into an ExtractedEmbed."""
    spec = _parse_chart_spec(raw_content)
    if spec is None:
        return None
    sub_type, title = _extract_chart_metadata(spec)
    return ExtractedEmbed(
        embed_id=uuid.uuid4(),
        embed_type="chart",
        sub_type=sub_type,
        title=title,
        payload=spec,
    )


# ---------------------------------------------------------------------------
# Handler registry
# ---------------------------------------------------------------------------

EmbedHandler = Callable[[str], Optional[ExtractedEmbed]]

_EMBED_HANDLERS: Dict[str, EmbedHandler] = {
    "chart": _handle_chart_block,
}

# Single regex that captures every fenced block: tag (group 1) + content (group 2).
# Only blocks whose tag appears in _EMBED_HANDLERS are processed; all others
# (python, json, bash, …) pass through untouched.
_FENCED_BLOCK_RE = re.compile(r"```(\w+)\s*\n(.*?)```", re.DOTALL)

# ---------------------------------------------------------------------------
# Placeholder builder
# ---------------------------------------------------------------------------


def _build_embed_placeholder(embed: ExtractedEmbed) -> str:
    """
    Build a ``<div data-node-type="pi-utility-embed">`` HTML placeholder
    for an extracted embed.

    The opening and closing tags are placed on separate lines so that
    CommonMark (markdown-it) recognises the block as a Type-7 HTML block
    and passes it through as raw HTML instead of wrapping it in ``<p>``.
    """
    attrs = f'data-node-type="pi-utility-embed" data-embed-id="{embed.embed_id}" data-embed-type="{embed.embed_type}"'
    if embed.sub_type:
        attrs += f' data-sub-type="{embed.sub_type}"'
    if embed.title:
        attrs += f' data-title="{embed.title}"'
    return f"<div {attrs}>\n</div>"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def extract_embeds(markdown: str) -> EmbedExtractionResult:
    """
    Scan *markdown* for fenced blocks whose tag matches a registered embed
    handler.  Matched blocks are replaced with lightweight HTML placeholders;
    unrecognised tags are left untouched.

    Returns an ``EmbedExtractionResult`` with the rewritten markdown and a
    list of ``ExtractedEmbed`` objects ready for DB persistence.
    """
    embeds: List[ExtractedEmbed] = []

    def _replacer(match: re.Match) -> str:
        tag = match.group(1).lower()
        handler = _EMBED_HANDLERS.get(tag)
        if handler is None:
            return match.group(0)

        embed = handler(match.group(2))
        if embed is None:
            log.warning("Skipping unparseable %s block during page save", tag)
            return match.group(0)

        embeds.append(embed)
        return _build_embed_placeholder(embed)

    rewritten = _FENCED_BLOCK_RE.sub(_replacer, markdown)

    return EmbedExtractionResult(
        rewritten_markdown=rewritten,
        embeds=embeds,
    )
