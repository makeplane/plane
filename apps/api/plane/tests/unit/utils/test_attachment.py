# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for attachment MIME resolution helpers."""

import pytest

from plane.utils.attachment import resolve_attachment_content_type


@pytest.mark.unit
class TestResolveAttachmentContentType:
    def test_prefers_provided_content_type(self):
        assert resolve_attachment_content_type("note.md", "text/plain") == "text/plain"
        assert resolve_attachment_content_type("note.md", "  text/markdown  ") == "text/markdown"

    def test_falls_back_for_empty_type_on_markdown(self):
        assert resolve_attachment_content_type("readme.md", "") == "text/markdown"
        assert resolve_attachment_content_type("readme.md", None) == "text/markdown"
        assert resolve_attachment_content_type("readme.md", False) == "text/markdown"

    def test_falls_back_for_empty_type_on_txt(self):
        assert resolve_attachment_content_type("notes.txt", "") == "text/plain"

    def test_falls_back_for_empty_type_on_csv(self):
        # Platform mimetypes may return text/csv or application/vnd.ms-excel
        resolved = resolve_attachment_content_type("data.csv", "")
        assert resolved in {"text/csv", "application/vnd.ms-excel"}

    def test_returns_none_without_name_or_type(self):
        assert resolve_attachment_content_type(None, "") is None
        assert resolve_attachment_content_type("", None) is None
