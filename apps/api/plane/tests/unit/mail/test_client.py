# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime, timezone

import pytest

from plane.mail.client import _summary_from_header


RAW_MESSAGE = (
    b"Subject: Project update\r\n"
    b"From: Alice <alice@example.com>\r\n"
    b"To: Bob <bob@example.com>\r\n"
    b"Date: Tue, 18 Jun 2024 12:00:00 +0000\r\n"
    b"MIME-Version: 1.0\r\n"
    b"Content-Type: text/plain; charset=utf-8\r\n"
    b"\r\n"
    b"Hello Bob,\r\n\r\n"
    b"The mail client preview should be visible in the message list."
)


@pytest.mark.unit
def test_summary_uses_partial_message_preview_as_snippet():
    summary = _summary_from_header(
        "inbox",
        42,
        {
            b"BODY[HEADER]": RAW_MESSAGE.split(b"\r\n\r\n", 1)[0] + b"\r\n\r\n",
            b"BODY[]<0.8192>": RAW_MESSAGE,
            b"FLAGS": [],
            b"INTERNALDATE": datetime(2024, 6, 18, 12, 0, tzinfo=timezone.utc),
            b"RFC822.SIZE": len(RAW_MESSAGE),
            b"BODYSTRUCTURE": b"TEXT",
        },
    )

    assert summary["snippet"] == "Hello Bob, The mail client preview should be visible in the message list."
    assert summary["subject"] == "Project update"
    assert summary["uid"] == "42"
