# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Third party imports
from bs4 import BeautifulSoup


def generate_plain_text_from_html(html_content):
    """
    Generate clean plain text from HTML email template.
    Preserves link destinations, removes HTML tags, styles, scripts, and excessive
    whitespace, and decodes HTML character references for the text/plain part.

    Args:
        html_content (str): The HTML content to convert to plain text

    Returns:
        str: Clean plain text without HTML tags, styles, excessive whitespace,
            or HTML character references
    """
    soup = BeautifulSoup(html_content, "html.parser")
    for tag in soup.find_all(["style", "script"]):
        tag.decompose()

    for link in soup.find_all("a", href=True):
        href = link["href"].strip()
        label = link.get_text().strip()
        # A visible URL (or mailto address) already carries its destination.
        visible_destination = href[7:] if href.lower().startswith("mailto:") else href
        if href and label not in (href, visible_destination):
            link.append(f" ({href})" if label else href)

    # The parser decodes entities once. Appending hrefs as text before extracting
    # it preserves query strings, including literal angle brackets in the URL.
    text_content = soup.get_text()

    # Remove excessive empty lines
    text_content = re.sub(r"\n\s*\n\s*\n+", "\n\n", text_content)

    # Ensure there's a leading and trailing whitespace
    text_content = "\n\n" + text_content.lstrip().rstrip() + "\n\n"

    return text_content
