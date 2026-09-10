# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from plane.utils.email import generate_plain_text_from_html


@pytest.mark.unit
class TestGeneratePlainTextFromHtml:
    """Test HTML-to-plain-text conversion used for email fallback bodies."""

    def test_decodes_escaped_query_separators_in_invitation_urls(self):
        html_content = """
        <p>If the button doesn’t work, copy and paste this link into your browser:</p>
        <a href="https://example.com/workspace-invitations/?invitation_id=abc&amp;slug=acme&amp;token=xyz">
          https://example.com/workspace-invitations/?invitation_id=abc&amp;slug=acme&amp;token=xyz
        </a>
        """

        text_content = generate_plain_text_from_html(html_content)

        assert "&amp;" not in text_content
        assert (
            "https://example.com/workspace-invitations/?invitation_id=abc&slug=acme&token=xyz" in text_content
        )

    def test_strips_style_blocks_and_tags(self):
        html_content = """
        <style>p { color: red; }</style>
        <p>Hello <strong>world</strong></p>
        """

        text_content = generate_plain_text_from_html(html_content)

        assert "color: red" not in text_content
        assert "<p>" not in text_content
        assert "Hello world" in text_content
