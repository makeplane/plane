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
_NON_WHITESPACE_RE = re.compile(r"\S")

# Smallest slice of the raw document to collapse whitespace in. Collapsing only
# ever shrinks text, so a window a few times the display budget supplies all the
# context a snippet can use for any realistic document; _normalized_window grows
# it when a pathologically whitespace-heavy document needs more.
_MIN_WINDOW_CHARS = 512


def _query_pattern(query: str) -> re.Pattern | None:
    """Compile ``query`` so it matches across any run of whitespace.

    The document is only whitespace-normalized in a window around the match, so
    the search itself runs against the raw text — where the query's words may be
    separated by newlines or runs of spaces.
    """
    tokens = [re.escape(token) for token in query.split()]
    if not tokens:
        return None
    return re.compile(r"\s+".join(tokens), re.IGNORECASE)


def _normalized_window(raw: str, anchor: int, need_left: int, need_right: int) -> tuple[str, int, bool, bool]:
    """Collapse whitespace in a bounded window of ``raw`` around ``anchor``.

    Returns the normalized window, the anchor's offset within it, and whether
    real content was left outside the window on either side.

    The window grows until it holds all the context the caller can use, so the
    excerpt matches what normalizing the entire document would produce without
    paying to rewrite the entire document for every search hit. ``anchor``
    always sits on a non-whitespace character (or at 0), so no whitespace run
    straddles it and the two halves can be collapsed independently.
    """
    left_span = max(need_left * 4, _MIN_WINDOW_CHARS)
    right_span = max(need_right * 4, _MIN_WINDOW_CHARS)

    while True:
        start = max(0, anchor - left_span)
        end = min(len(raw), anchor + right_span)

        left = _WHITESPACE_RE.sub(" ", raw[start:anchor])
        right = _WHITESPACE_RE.sub(" ", raw[anchor:end])

        # Reproduce the document-level strip() at the real edges only.
        if start == 0:
            if left:
                left = left.lstrip()
            else:
                right = right.lstrip()
        if end == len(raw):
            if right:
                right = right.rstrip()
            else:
                left = left.rstrip()

        covers_all = start == 0 and end == len(raw)
        enough_left = start == 0 or len(left) >= need_left
        enough_right = end == len(raw) or len(right) >= need_right

        if covers_all or (enough_left and enough_right):
            # A search bounded to the discarded region: it stops at the first
            # non-whitespace character, so this does not rescan the document.
            more_before = start > 0 and _NON_WHITESPACE_RE.search(raw, 0, start) is not None
            more_after = end < len(raw) and _NON_WHITESPACE_RE.search(raw, end) is not None
            return left + right, len(left), more_before, more_after

        left_span *= 4
        right_span *= 4


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

    # Locate the match in the raw text: scanning is cheap, whereas collapsing
    # whitespace across a large document allocates a full copy of it per result.
    pattern = _query_pattern(query)
    match = pattern.search(stripped_text) if pattern else None
    anchor = match.start() if match else 0

    text, match_pos, more_before, more_after = _normalized_window(
        stripped_text,
        anchor,
        need_left=lead if match else 0,
        need_right=max_length,
    )
    if not text:
        return ""

    if match is None:
        # No content match: excerpt from the start of the document.
        if not more_after and len(text) <= max_length:
            return text
        # Reserve room for the trailing ellipsis inside the budget.
        return text[: max_length - len(_ELLIPSIS)] + _ELLIPSIS

    start = max(0, match_pos - lead)
    prefix = _ELLIPSIS if start > 0 or more_before else ""

    # Whatever the leading ellipsis costs comes out of the budget, not on top of it.
    budget = max_length - len(prefix)
    if start + budget < len(text) or more_after:
        # The excerpt will not reach the end of the text, so a trailing ellipsis
        # is needed — reserve its room before slicing.
        budget -= len(_ELLIPSIS)

    if budget <= 0:
        # The markers alone exhaust the budget; show a single one rather than
        # letting a negative slice bound run backwards through the text.
        return _ELLIPSIS[:max_length]

    end = min(len(text), start + budget)
    suffix = _ELLIPSIS if end < len(text) or more_after else ""
    return prefix + text[start:end] + suffix
