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

    ``max_length`` bounds the WHOLE returned string: the ellipsis markers are
    paid for out of that budget, never appended on top of it, so a caller sizing
    its layout on ``max_length`` is never handed a longer string. A budget too
    small to hold any text yields just a marker, and a non-positive budget
    yields an empty string — never a longer fallback.
    """
    if not stripped_text:
        return ""

    # A non-positive budget has no room for anything. Guarding here keeps the
    # slice arithmetic below from going negative, which would otherwise turn
    # text[:max_length - 1] into a near-complete copy of the document.
    if max_length <= 0:
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
        if len(text) <= max_length:
            return text
        # Reserve room for the trailing ellipsis inside the budget.
        return text[: max_length - len(_ELLIPSIS)] + _ELLIPSIS

    start = max(0, match.start() - lead)
    prefix = _ELLIPSIS if start > 0 else ""

    # Whatever the leading ellipsis costs comes out of the budget, not on top of it.
    budget = max_length - len(prefix)
    if start + budget < len(text):
        # The excerpt will not reach the end of the text, so a trailing ellipsis
        # is needed — reserve its room before slicing.
        budget -= len(_ELLIPSIS)

    if budget <= 0:
        # The markers alone exhaust the budget; show a single one rather than
        # letting a negative slice bound run backwards through the text.
        return _ELLIPSIS[:max_length]

    end = min(len(text), start + budget)
    suffix = _ELLIPSIS if end < len(text) else ""
    return prefix + text[start:end] + suffix
