# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from datetime import date

import pytest

from plane.bgtasks.page_version_task import track_page_version
from plane.db.models import Page, PageVersion


@pytest.mark.unit
class TestTrackPageVersion:
    """Test the sub pages snapshot stored on page versions"""

    @pytest.mark.django_db
    def test_sub_pages_data_snapshots_direct_children(self, workspace, create_user):
        page = Page.objects.create(
            workspace=workspace,
            name="Root",
            owned_by=create_user,
            description_html="<p>updated</p>",
        )
        child = Page.objects.create(workspace=workspace, name="Child", owned_by=create_user, parent=page)
        archived_child = Page.objects.create(
            workspace=workspace,
            name="Archived Child",
            owned_by=create_user,
            parent=page,
            archived_at=date(2026, 7, 7),
        )
        # A grandchild must not appear in the snapshot of the root page
        grandchild = Page.objects.create(workspace=workspace, name="Grandchild", owned_by=create_user, parent=child)

        existing_instance = json.dumps({"description_html": "<p>old</p>"})
        track_page_version(page_id=page.id, existing_instance=existing_instance, user_id=create_user.id)

        page_version = PageVersion.objects.get(page_id=page.id)
        assert page_version.sub_pages_data == {
            str(child.id): {"name": "Child", "archived_at": None},
            str(archived_child.id): {"name": "Archived Child", "archived_at": "2026-07-07"},
        }
        assert str(grandchild.id) not in page_version.sub_pages_data

    @pytest.mark.django_db
    def test_sub_pages_data_empty_without_children(self, workspace, create_user):
        page = Page.objects.create(
            workspace=workspace,
            name="Leaf",
            owned_by=create_user,
            description_html="<p>updated</p>",
        )

        existing_instance = json.dumps({"description_html": "<p>old</p>"})
        track_page_version(page_id=page.id, existing_instance=existing_instance, user_id=create_user.id)

        page_version = PageVersion.objects.get(page_id=page.id)
        assert page_version.sub_pages_data == {}
