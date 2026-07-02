# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch

import pytest

from plane.utils.importers.eva.extract import EvaExtractor


@pytest.mark.unit
def test_eva_extractor_extract_project_respects_import_scope():
    client = MagicMock()
    client.call.side_effect = [
        [{"id": "CmfTask:1"}],
        [{"id": "CmfComment:1"}],
        [{"id": "CmfAttachment:1"}],
        [{"id": "CmfDocument:1"}],
        [{"id": "CmfTestcase:1"}],
        [{"id": "CmfComment:2"}],
    ]
    extractor = EvaExtractor(client)

    extracted = extractor.extract_project("CmfProject:1", import_tasks=False, import_testcases=True)

    assert extracted["tasks"] == []
    assert extracted["comments"] == []
    assert extracted["attachments"] == []
    assert extracted["documents"] == []
    assert len(extracted["testcases"]) == 1
    assert len(extracted["testcase_comments"]) == 1
    assert client.call.call_count == 2


@pytest.mark.unit
def test_eva_extractor_preview_counts():
    client = MagicMock()
    client.call.side_effect = [
        [
            {
                "id": "CmfTask:1",
                "cache_status_type": "OPEN",
                "tags": [{"name": "api"}],
                "lists": [{"code": "SPR-1"}],
                "fix_versions": [{"code": "REL-1"}],
                "responsible": {"login": "user@example.com"},
                "cmf_author": {"login": "author@example.com"},
            }
        ],
        [{"id": "CmfComment:1", "cmf_author": {"login": "commenter@example.com"}}],
        [{"id": "CmfAttachment:1"}],
        [],
        [],
        [],
    ]

    extractor = EvaExtractor(client)
    counts = extractor.preview_counts("CmfProject:1")

    assert counts["total_tasks"] == 1
    assert counts["total_comments"] == 1
    assert counts["total_attachments"] == 1
    assert counts["total_labels"] == 1
    assert counts["total_users"] == 3
    assert counts["total_cycles"] == 1
    assert counts["total_modules"] == 1


@pytest.mark.unit
def test_eva_extractor_batch_fetch_chunks_requests():
    client = MagicMock()
    client.call.side_effect = [
        [{"id": "row-1"}, {"id": "row-2"}],
        [{"id": "row-3"}],
    ]
    extractor = EvaExtractor(client)

    with patch("plane.utils.importers.eva.extract.CHUNK_SIZE", 2):
        rows = extractor._batch_fetch("CmfComment.list", ["a", "b", "c"], {"fields": ["text"]})

    assert len(rows) == 3
    assert client.call.call_count == 2
