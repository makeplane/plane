# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.gitlab_sync import extract_work_item_key, normalize_work_item_text


@pytest.mark.unit
@pytest.mark.parametrize(
    "text,expected",
    [
        ("ENG-42 fix login", ("ENG", 42)),
        ("eng-7: update docs", ("ENG", 7)),
        ("ABC-1", ("ABC", 1)),
        ("  PROJ-99 something", ("PROJ", 99)),
        ("Draft: ENG-42 add feature", ("ENG", 42)),
        ("WIP: eng-3 tweak", ("ENG", 3)),
        ("draft:ABC-9", ("ABC", 9)),
        ("ENG-42 fix login\n\nLonger body without key", ("ENG", 42)),
        ("fix ENG-42", None),
        ("no-key here", None),
        ("", None),
        (None, None),
    ],
)
def test_extract_work_item_key(text, expected):
    assert extract_work_item_key(text) == expected


@pytest.mark.unit
def test_normalize_strips_draft_prefix():
    assert normalize_work_item_text("Draft: ENG-1 title") == "ENG-1 title"
    assert normalize_work_item_text("WIP: ENG-1 title") == "ENG-1 title"
