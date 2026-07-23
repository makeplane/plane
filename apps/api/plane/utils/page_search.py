# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helpers for the page search API.

Pages carry a maintained ``description_stripped`` column (plain text derived
from ``description_html`` on save). Search results include a short excerpt of
that text centered on the query match so callers can preview *why* a page
matched without downloading the full document.
"""

import re

# Snippet sizing.
#
# ``SNIPPET_MAX_LENGTH`` keeps each result light — a search response can carry a
# full page of hits, and pages can hold very large documents, so the excerpt is
# capped rather than returning the whole stripped body. 200 characters is enough
# to show the match with surrounding context on a single line while keeping the
# payload small.
#
# ``SNIPPET_LEAD_CHARS`` is how much preceding context to include so the matched
# term is not flush against the left edge of the excerpt; the remaining budget
# after the lead shows the match and the text that follows it.
SNIPPET_MAX_LENGTH = 200
SNIPPET_LEAD_CHARS = 40

_ELLIPSIS = "…"
_WHITESPACE_RE = re.compile(r"\s+")


def build_page_snippet(
    stripped_text: str | None,
    query: str,
    max_length: int = SNIPPET_MAX_LENGTH,
    lead: int = SNIPPET_LEAD_CHARS,
) -> str:
    """Return a short single-line excerpt of ``stripped_text``.

    When ``query`` appears in the text the excerpt is taken around the first
    (case-insensitive) occurrence, with ``lead`` characters of leading context.
    When the query does not appear in the text (for example the page matched on
    its name only, or no query was supplied) the excerpt is taken from the start
    of the text. An ellipsis marks either side that was truncated.
    """
    if not stripped_text:
        return ""

    # Collapse runs of whitespace/newlines so the excerpt reads as one clean line.
    text = _WHITESPACE_RE.sub(" ", stripped_text).strip()
    if not text:
        return ""

    # Search the original text case-insensitively so the match offset stays
    # aligned with the string we slice. (Indexing into text.lower() would drift
    # for characters that change length when lowercased, e.g. "İ".)
    match = re.search(re.escape(query), text, re.IGNORECASE) if query else None

    if match is None:
        # No content match: excerpt from the start of the document.
        excerpt = text[:max_length]
        suffix = _ELLIPSIS if len(text) > max_length else ""
        return excerpt + suffix

    start = max(0, match.start() - lead)
    end = min(len(text), start + max_length)
    excerpt = text[start:end]
    prefix = _ELLIPSIS if start > 0 else ""
    suffix = _ELLIPSIS if end < len(text) else ""
    return prefix + excerpt + suffix
