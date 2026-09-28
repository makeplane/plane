# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.email import generate_plain_text_from_html


@pytest.mark.unit
class TestGeneratePlainTextFromHtml:
    """Covers the HTML-to-plain-text conversion used for the text/plain part of emails."""

    def test_decodes_escaped_query_separators_in_invitation_urls(self):
        """The copy-paste fallback link must keep `&` so query params survive."""
        url = "https://example.com/workspace-invitations/?invitation_id=abc&slug=acme&token=xyz"
        html_content = f"""
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <a href="{url.replace("&", "&amp;")}">
          <span>{url.replace("&", "&amp;")}</span>
        </a>
        """

        text_content = generate_plain_text_from_html(html_content)

        assert "&amp;" not in text_content
        assert "amp;slug" not in text_content
        assert url in text_content

    def test_decodes_common_entities(self):
        """Named and numeric character references should not leak into plain text."""
        html_content = "<p>Ren&eacute;&#39;s workspace &lt;tag&gt; &amp; more &nbsp;here</p>"

        text_content = generate_plain_text_from_html(html_content)

        assert "René's workspace <tag> & more" in text_content
        assert "&eacute;" not in text_content
        assert "&#39;" not in text_content
        assert "&nbsp;" not in text_content

    def test_strips_style_blocks_and_tags(self):
        html_content = """
        <style>p { color: red; }</style>
        <p>Hello <strong>world</strong></p>
        """

        text_content = generate_plain_text_from_html(html_content)

        assert "color: red" not in text_content
        assert "<p>" not in text_content
        assert "Hello world" in text_content

    def test_collapses_excessive_blank_lines_and_pads_output(self):
        html_content = "<p>First</p>\n\n\n\n<p>Second</p>"

        text_content = generate_plain_text_from_html(html_content)

        assert "\n\n\n" not in text_content.strip()
        assert text_content.startswith("\n\n")
        assert text_content.endswith("\n\n")
