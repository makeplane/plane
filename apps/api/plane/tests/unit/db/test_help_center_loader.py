# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the content-as-code Help Center loader rendering helpers.

These exercise the pure markdown -> sanitized HTML -> screenshot-marker pipeline
(`render_body`) plus frontmatter and locale parsing. No DB access: the rendering
contract is what the seed command relies on, so it is pinned here in isolation.
"""

import pytest

from plane.db.fixtures.help_center.loader import (
    locale_from_filename,
    parse_frontmatter,
    render_body,
)


@pytest.mark.unit
class TestRenderBodyMarkdown:
    """markdown -> allowlist-safe HTML (mistune + sanitize_help_html)."""

    def test_headings_paragraphs_and_emphasis(self):
        html = render_body("# Tiêu đề\n\nĐoạn **đậm** và *nghiêng*.")
        assert "<h1>" in html and "Tiêu đề" in html
        assert "<strong>đậm</strong>" in html
        assert "<em>nghiêng</em>" in html

    def test_unordered_and_ordered_lists(self):
        html = render_body("- một\n- hai\n\n1. ba\n2. bốn")
        assert "<ul>" in html and "<ol>" in html
        assert html.count("<li>") == 4

    def test_links_keep_href(self):
        html = render_body("[Hồ sơ](https://example.com/profile)")
        assert '<a href="https://example.com/profile"' in html
        assert ">Hồ sơ</a>" in html

    def test_table_plugin_renders(self):
        md = "| Cột A | Cột B |\n| --- | --- |\n| 1 | 2 |"
        html = render_body(md)
        assert "<table>" in html
        assert "<th>" in html and "<td>" in html

    def test_blockquote_and_code(self):
        html = render_body("> Ghi chú\n\n`inline` và:\n\n```\nblock\n```")
        assert "<blockquote>" in html
        assert "<code>" in html

    def test_strikethrough_plugin_renders(self):
        # The strikethrough plugin is enabled on the loader's markdown instance,
        # so `~~text~~` must produce a <del> element (pinned to catch a plugin drop).
        html = render_body("Trạng thái ~~cũ~~ mới")
        assert "<del>cũ</del>" in html

    def test_empty_body_yields_empty_paragraph(self):
        # sanitize_help_html turns falsy HTML into a single empty paragraph.
        assert render_body("") == "<p></p>"


@pytest.mark.unit
class TestRenderBodySanitization:
    """Raw HTML authored in markdown source is escaped to inert text: mistune is
    configured without raw-HTML passthrough, so a live <script> or styled element
    can never form (the sanitizer is a second line of defense behind this)."""

    def test_raw_script_is_escaped_not_executed(self):
        html = render_body("Trước\n\n<script>alert(1)</script>\n\nSau")
        # No live tag — only the escaped, harmless text rendering.
        assert "<script>" not in html
        assert "<script " not in html
        assert "&lt;script&gt;" in html

    def test_raw_style_attribute_never_becomes_a_live_attribute(self):
        html = render_body('<p style="position:fixed;top:0">overlay</p>')
        # The styled element is escaped to inert text — no LIVE element opens with
        # a style attribute, so the overlay/clickjacking surface stays closed. The
        # text content is preserved (escaped), proving the input was rendered, not
        # dropped. Asserting the absence of a live `<p style` (rather than the bare
        # substring `style=`, which survives inside the escaped text) keeps this
        # robust to nh3/mistune escaping details.
        assert "<p style=" not in html
        assert "overlay" in html


@pytest.mark.unit
class TestScreenshotMarkerSurvival:
    """`{{screenshot:NAME}}` placeholders convert to markers AFTER sanitize, so
    the static allowlist cannot strip them. Block placeholders become a <p>
    marker; inline ones a <span> marker."""

    def test_block_placeholder_becomes_p_marker(self):
        html = render_body("Mở trang chủ:\n\n{{screenshot:trang-chu}}")
        assert '<p data-help-screenshot="trang-chu"></p>' in html
        # The literal token must not survive.
        assert "{{screenshot" not in html

    def test_inline_placeholder_becomes_span_marker(self):
        html = render_body("Nhấn {{screenshot:cmd-k}} để mở bảng lệnh.")
        assert '<span data-help-screenshot="cmd-k"></span>' in html
        assert "{{screenshot" not in html

    def test_multiple_distinct_markers_each_preserved(self):
        html = render_body("{{screenshot:a-one}}\n\n{{screenshot:b-two}}")
        assert '<p data-help-screenshot="a-one"></p>' in html
        assert '<p data-help-screenshot="b-two"></p>' in html

    def test_marker_survives_when_combined_with_real_content(self):
        html = render_body("## Bước 1\n\nLàm việc với dự án.\n\n{{screenshot:du-an}}")
        assert "<h2>" in html
        assert '<p data-help-screenshot="du-an"></p>' in html


@pytest.mark.unit
class TestScreenshotMarkerCodeProtection:
    """Markers inside inline-code or fenced-code blocks must NOT be converted.
    They are literal documentation examples, not real screenshot placeholders."""

    def test_inline_code_token_stays_literal(self):
        # `{{screenshot:ten-kebab}}` inside backticks -> <code>{{screenshot:…}}</code>
        # The loader must leave the content of the code span unchanged.
        html = render_body("Cú pháp: `{{screenshot:ten-kebab}}`")
        assert "<code>{{screenshot:ten-kebab}}</code>" in html
        assert 'data-help-screenshot="ten-kebab"' not in html

    def test_fenced_code_block_token_stays_literal(self):
        # A token inside a fenced code block is a literal example, not a real marker.
        md = "Ví dụ:\n\n```\n{{screenshot:fenced-example}}\n```"
        html = render_body(md)
        assert "{{screenshot:fenced-example}}" in html
        assert 'data-help-screenshot="fenced-example"' not in html

    def test_real_block_marker_outside_code_still_converts(self):
        # A standalone paragraph token outside any code span must still become
        # the block marker as before.
        html = render_body("Xem hình:\n\n{{screenshot:abc}}\n\nKết thúc.")
        assert '<p data-help-screenshot="abc"></p>' in html
        assert "{{screenshot:abc}}" not in html

    def test_real_inline_marker_in_prose_still_converts(self):
        # An inline token in normal prose (not inside backticks) must still become
        # the span marker as before.
        html = render_body("Nhấn {{screenshot:abc}} để mở.")
        assert '<span data-help-screenshot="abc"></span>' in html
        assert "{{screenshot:abc}}" not in html


@pytest.mark.unit
class TestParseFrontmatter:
    def test_splits_meta_and_body(self):
        meta, body = parse_frontmatter("---\nslug: ho-so\ntitle: Hồ sơ\n---\nNội dung")
        assert meta == {"slug": "ho-so", "title": "Hồ sơ"}
        assert body == "Nội dung"

    def test_no_frontmatter_returns_empty_meta_and_full_text(self):
        meta, body = parse_frontmatter("Không có frontmatter")
        assert meta == {}
        assert body == "Không có frontmatter"


@pytest.mark.unit
class TestLocaleFromFilename:
    @pytest.mark.parametrize("filename,expected", [
        ("ho-so.vi.md", "vi"),
        ("getting-started.en.md", "en"),
        ("intro.ko.md", "ko"),
    ])
    def test_recognised_locales(self, filename, expected):
        assert locale_from_filename(filename) == expected

    @pytest.mark.parametrize("filename", ["README.md", "notes.txt", "x.fr.md", "categories.yaml"])
    def test_unrecognised_returns_none(self, filename):
        assert locale_from_filename(filename) is None
