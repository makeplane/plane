# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch

import pytest

from plane.utils.importers.eva.load import EvaLoader


@pytest.mark.unit
def test_eva_loader_initializes_progress_totals():
    importer = MagicMock()
    importer.pk = "importer-id"
    importer.imported_data = None
    loader = EvaLoader(
        importer=importer,
        workspace=MagicMock(id="workspace-id"),
        project=MagicMock(),
        testcase_project=MagicMock(),
        actor=MagicMock(),
        config={},
        data={},
    )

    loader._init_progress(
        {
            "tasks": [{"id": "1"}, {"id": "2"}],
            "testcases": [{"id": "t1"}],
            "comments": [{"id": "c1"}, {"id": "c2"}, {"id": "c3"}],
            "attachments": [],
            "documents": [{"id": "d1"}],
        }
    )

    # setup + tasks(2) + testcases(1) + comments(3) + attachments(0) + relations(2) + documents(1)
    assert loader._progress_total == 10


@pytest.mark.unit
def test_eva_loader_persists_progress_updates():
    importer = MagicMock()
    importer.pk = "importer-id"
    importer.imported_data = None
    loader = EvaLoader(
        importer=importer,
        workspace=MagicMock(id="workspace-id"),
        project=MagicMock(),
        testcase_project=MagicMock(),
        actor=MagicMock(),
        config={},
        data={},
    )
    loader._init_progress({"tasks": [{"id": "1"}], "comments": [], "testcases": [], "attachments": [], "documents": []})

    with patch("plane.utils.importers.eva.load.Importer.objects.filter") as importer_filter:
        loader._update_progress("tasks", increment=1, force=True)

    payload = importer.imported_data
    assert payload["progress"]["phase"] == "tasks"
    assert payload["progress"]["completed"] == 1
    assert payload["progress"]["percent"] == 33
    importer_filter.assert_called_once()


@pytest.mark.unit
def test_eva_loader_repairs_existing_page_description():
    importer = MagicMock()
    importer.pk = "importer-id"
    importer.imported_data = None
    existing_page = MagicMock()
    existing_page.id = "page-id"
    existing_page.description_html = (
        '<image-component src="https://eva.example.com/files/obj/doc/picture.png" status="uploaded"></image-component>'
    )
    loader = EvaLoader(
        importer=importer,
        workspace=MagicMock(id="workspace-id"),
        project=MagicMock(),
        testcase_project=MagicMock(),
        actor=MagicMock(),
        config={"url": "https://eva.example.com", "token": "token"},
        data={},
    )
    loader.eva_client.base_url = "https://eva.example.com"
    loader.eva_client.token = "token"
    document = {"id": "doc-1", "text": '<img src="/files/obj/doc/picture.png" data-attach-id="CmfAttachment:1">'}
    repaired_html = '<image-component src="asset-uuid" status="uploaded"></image-component>'

    with (
        patch("plane.utils.importers.eva.load.Page.objects.filter") as page_filter,
        patch("plane.utils.importers.eva.load.ProjectPage.objects.filter", return_value=MagicMock(exists=MagicMock(return_value=True))),
        patch.object(loader, "_update_progress"),
        patch.object(loader, "_import_description_media", return_value=repaired_html) as import_media,
    ):
        page_filter.return_value.first.return_value = existing_page
        loader._import_documents([document], {})

    import_media.assert_called_once()
    existing_page.save.assert_called_once_with(update_fields=["description_html"])
    assert existing_page.description_html == repaired_html
    assert loader.stats["documents_repaired"] == 1
