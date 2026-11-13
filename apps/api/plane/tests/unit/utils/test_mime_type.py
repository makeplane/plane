# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for infer_mime_type.

Background: browsers report an empty `type` for files with extensions they
don't have a registered MIME mapping for (e.g. Markdown in some cases), which
made uploads allowed by settings.ATTACHMENT_MIME_TYPES fail with
"Invalid file type." before any inference was attempted.
"""

import pytest

from plane.utils.mime_type import infer_mime_type

pytestmark = pytest.mark.unit


class TestInferMimeType:
    @pytest.mark.parametrize(
        "filename, expected",
        [
            ("meta_pixel_h5_standard_events_integration.md", "text/markdown"),
            ("notes.MD", "text/markdown"),
            ("report.pdf", "application/pdf"),
            ("photo.png", "image/png"),
            ("photo.webp", "image/webp"),
            ("archive.tar.gz", "application/x-tar"),
            # gzip is reported as an encoding rather than a media type
            ("archive.gz", "application/gzip"),
            ("no-extension", None),
            ("", None),
            (None, None),
        ],
    )
    def test_infer_mime_type(self, filename, expected):
        assert infer_mime_type(filename) == expected
