# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.research.utils.files import (
    detect_kind,
    markdown_to_html,
    validate_attachment,
)

pytestmark = pytest.mark.unit

LIMITS = {"image_max_mb": 20, "pdf_max_mb": 100, "markdown_max_mb": 5}
MB = 1024 * 1024


class TestFileValidation:
    def test_pdf_is_accepted(self):
        assert (
            validate_attachment(
                file_name="report.pdf",
                content_type="application/pdf",
                size_bytes=2 * MB,
                limits=LIMITS,
                header_bytes=b"%PDF-1.7",
            )
            is None
        )

    def test_executable_disguised_as_pdf_is_rejected(self):
        assert (
            validate_attachment(
                file_name="report.pdf",
                content_type="application/pdf",
                size_bytes=1024,
                limits=LIMITS,
                header_bytes=b"\x7fELF\x02\x01\x01",
            )
            == "file_type_not_allowed"
        )

    def test_image_with_wrong_signature_is_rejected(self):
        assert (
            validate_attachment(
                file_name="photo.png",
                content_type="image/png",
                size_bytes=2048,
                limits=LIMITS,
                header_bytes=b"MZ\x90\x00",
            )
            == "file_type_not_allowed"
        )

    def test_valid_png_signature_is_accepted(self):
        assert (
            validate_attachment(
                file_name="photo.png",
                content_type="image/png",
                size_bytes=2048,
                limits=LIMITS,
                header_bytes=b"\x89PNG\r\n\x1a\n",
            )
            is None
        )

    def test_size_limits_are_per_kind(self):
        assert (
            validate_attachment(
                file_name="photo.png",
                content_type="image/png",
                size_bytes=21 * MB,
                limits=LIMITS,
            )
            == "file_size_exceeded"
        )
        assert (
            validate_attachment(
                file_name="paper.pdf",
                content_type="application/pdf",
                size_bytes=99 * MB,
                limits=LIMITS,
            )
            is None
        )
        assert (
            validate_attachment(
                file_name="notes.md",
                content_type="text/markdown",
                size_bytes=6 * MB,
                limits=LIMITS,
            )
            == "file_size_exceeded"
        )

    def test_unknown_types_are_rejected(self):
        assert (
            validate_attachment(
                file_name="script.sh",
                content_type="application/x-sh",
                size_bytes=1024,
                limits=LIMITS,
            )
            == "file_type_not_allowed"
        )

    def test_zero_byte_upload_is_rejected(self):
        assert (
            validate_attachment(
                file_name="empty.pdf",
                content_type="application/pdf",
                size_bytes=0,
                limits=LIMITS,
            )
            == "file_size_exceeded"
        )

    def test_kind_detection(self):
        assert detect_kind("a.pdf", "application/pdf") == "PDF"
        assert detect_kind("a.PNG", "image/png") == "IMAGE"
        assert detect_kind("a.md", "text/markdown") == "MARKDOWN"
        assert detect_kind("a.zip", "application/zip") == "OTHER"


class TestMarkdownImport:
    def test_structures_are_preserved(self):
        source = "\n".join(
            [
                "# Weekly summary",
                "",
                "- finished the experiment",
                "- wrote the draft",
                "",
                "```python",
                "print('hello')",
                "```",
                "",
                "| run | result |",
                "| --- | --- |",
                "| 1 | ok |",
            ]
        )
        html, local_images = markdown_to_html(source)
        assert "<h1>Weekly summary</h1>" in html
        assert "<ul>" in html and "<li>finished the experiment</li>" in html
        assert "<pre><code>" in html
        assert "<table>" in html and "<td>ok</td>" in html
        assert local_images == []

    def test_remote_images_are_kept_and_local_images_are_reported(self):
        html, local_images = markdown_to_html(
            "![remote](https://example.com/a.png)\n\n![local](./b.png)"
        )
        assert 'src="https://example.com/a.png"' in html
        assert local_images == ["./b.png"]

    def test_scripts_are_stripped(self):
        html, _ = markdown_to_html('<script>alert("x")</script>\n\n# Title')
        assert "<script" not in html
        assert "<h1>Title</h1>" in html

    def test_empty_content_still_produces_a_body(self):
        html, _ = markdown_to_html("")
        assert html == "<p></p>"
