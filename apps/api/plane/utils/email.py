# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import html
import re

# Django imports
from django.utils.html import strip_tags

_STYLE_OPEN_RE = re.compile(r"<style", re.IGNORECASE)
_STYLE_CLOSE_RE = re.compile(r"</style>", re.IGNORECASE)


def _remove_style_blocks(html_content):
    """
    Remove `<style ...>...</style>` blocks (case-insensitive) in a single
    forward scan, leaving the surrounding content unchanged.
    """
    parts = []
    pos = 0
    while start := _STYLE_OPEN_RE.search(html_content, pos):
        tag_end = html_content.find(">", start.end())
        if tag_end == -1:
            break
        close = _STYLE_CLOSE_RE.search(html_content, tag_end + 1)
        if close is None:
            break
        parts.append(html_content[pos : start.start()])
        pos = close.end()
    parts.append(html_content[pos:])
    return "".join(parts)


def generate_plain_text_from_html(html_content):
    """
    Generate clean plain text from HTML email template.
    Removes all HTML tags, CSS styles, and excessive whitespace, and decodes
    HTML character references so the text/plain part reads as literal text.

    Args:
        html_content (str): The HTML content to convert to plain text

    Returns:
        str: Clean plain text without HTML tags, styles, excessive whitespace,
            or HTML character references
    """
    # Remove style tags and their content
    html_content = _remove_style_blocks(html_content)

    # Strip HTML tags, then decode character references. `strip_tags` re-emits
    # entity refs verbatim, so URLs escaped for the HTML part would otherwise
    # reach the text/plain part as `?a=1&amp;b=2` and break when pasted.
    text_content = html.unescape(strip_tags(html_content))

    # Remove excessive empty lines
    text_content = re.sub(r"\n\s*\n\s*\n+", "\n\n", text_content)

    # Ensure there's a leading and trailing whitespace
    text_content = "\n\n" + text_content.lstrip().rstrip() + "\n\n"

    return text_content
