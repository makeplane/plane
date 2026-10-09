# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

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

    @pytest.mark.parametrize(
        ("html_content", "expected"),
        [
            (
                '<p>Open <a href="https://example.com/issue/123">the work item</a> to continue.</p>',
                "Open the work item (https://example.com/issue/123) to continue.",
            ),
            (
                '<a href="https://example.com/?a=1&amp;b=2"><span>View</span> <strong>work item</strong></a>',
                "View work item (https://example.com/?a=1&b=2)",
            ),
            (
                '<a href="https://example.com/?q=&lt;tag&gt;&amp;page=2">Search</a>',
                "Search (https://example.com/?q=<tag>&page=2)",
            ),
            (
                '<a href="https://example.com/?a=1&amp;b=2">\n<span>https://example.com/?a=1&amp;b=2</span>\n</a>',
                "https://example.com/?a=1&b=2",
            ),
            (
                '<a href="https://example.com/issue/123"><img src="button.png" alt="View work item" /></a>',
                "https://example.com/issue/123",
            ),
            ('<a href="https://example.com/issue/123"></a>', "https://example.com/issue/123"),
            ('<a href="   ">Work item</a>', "Work item"),
            ('<a name="work-item">Work item</a>', "Work item"),
            ('<a href="mailto:reader@example.com">reader@example.com</a>', "reader@example.com"),
            ('<a href="mailto:help@example.com">Contact support</a>', "Contact support (mailto:help@example.com)"),
            (
                '<a href="mailto:help@example.com?subject=Question">help@example.com</a>',
                "help@example.com (mailto:help@example.com?subject=Question)",
            ),
        ],
    )
    def test_preserves_link_destinations(self, html_content, expected):
        assert generate_plain_text_from_html(html_content).strip() == expected

    def test_issue_update_multipart_email_keeps_action_links_in_plain_text(self):
        issue_url = "https://example.com/acme/project/issues/123?source=email&view=detail"
        preferences_url = "https://example.com/settings/profile/notifications"
        html_content = render_to_string(
            "emails/notifications/issue-updates.html",
            {
                "entity_type": "work item",
                "issue": {"issue_identifier": "TEST-123", "name": "Preserve notification links"},
                "workspace": "Acme",
                "project": "Test project",
                "project_url": "https://example.com/acme/project/",
                "issue_url": issue_url,
                "user_preference": preferences_url,
                "receiver": {"email": "reader@example.com"},
                "data": [],
                "comments": [],
            },
        )
        message = EmailMultiAlternatives(
            subject="TEST-123 updates",
            body=generate_plain_text_from_html(html_content),
            to=["reader@example.com"],
        )
        message.attach_alternative(html_content, "text/html")
        parts = {
            part.get_content_type(): part.get_payload(decode=True).decode(part.get_content_charset())
            for part in message.message().walk()
            if not part.is_multipart()
        }
        plain_text = " ".join(parts["text/plain"].split())

        assert f"View work item ({issue_url})" in plain_text
        assert f"manage your email preferences ({preferences_url})" in plain_text
        assert "font-family" not in plain_text
        assert "@media" not in plain_text
        assert "&amp;" not in plain_text
        assert parts["text/html"] == html_content
