# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for the page-version tracking task.

``track_page_version`` populates a ``PageVersion`` snapshot from a ``Page``.
The task body is wrapped in a broad ``except Exception: log_exception(e)``,
so any attribute error inside it is swallowed and simply results in *no*
version being written -- silently breaking page version-history with no
user-visible error.

These tests pin the regression: the task must read the page's
``description_json`` field (not the long-removed ``description`` field),
must not raise, and must persist that JSON onto the created/updated
``PageVersion`` row.
"""

import json

import pytest
from django.utils import timezone

from plane.bgtasks.page_version_task import (
    PAGE_VERSION_TASK_TIMEOUT,
    track_page_version,
)
from plane.db.models import Page, PageVersion
from plane.tests.factories import UserFactory, WorkspaceFactory


def _make_page(workspace, user, description_json, description_html):
    """Create a Page with explicit description fields set."""
    return Page.objects.create(
        workspace=workspace,
        owned_by=user,
        name="Test Page",
        description_json=description_json,
        description_html=description_html,
    )


@pytest.mark.unit
@pytest.mark.django_db
class TestTrackPageVersion:
    def test_create_path_persists_description_json(self):
        """First edit of a page must create a PageVersion whose
        ``description_json`` is copied from ``page.description_json``.

        Regression guard: before the fix the task read ``page.description``
        -- a field that no longer exists -- raising AttributeError that the
        broad except swallowed, so zero versions were ever written.
        """
        user = UserFactory()
        workspace = WorkspaceFactory(owner=user)
        description_json = {"type": "doc", "content": [{"type": "paragraph"}]}
        page = _make_page(
            workspace,
            user,
            description_json=description_json,
            description_html="<p>hello</p>",
        )

        # existing_instance=None => current_instance is {}, so the
        # description_html comparison differs and the version branch runs.
        track_page_version(page.id, None, user.id)

        versions = PageVersion.objects.filter(page_id=page.id)
        assert versions.count() == 1, "exactly one version should be written"
        version = versions.first()
        assert version.description_json == description_json
        assert version.description_html == "<p>hello</p>"
        assert version.owned_by_id == user.id

    def test_update_path_updates_existing_version_in_place(self):
        """A subsequent edit by the same user within the timeout window must
        update the existing version in place (not create a second one), and
        the updated ``description_json`` must reflect the new page state.
        """
        user = UserFactory()
        workspace = WorkspaceFactory(owner=user)
        page = _make_page(
            workspace,
            user,
            description_json={"v": 1},
            description_html="<p>v1</p>",
        )

        # First edit -> creates the initial version.
        track_page_version(page.id, None, user.id)
        assert PageVersion.objects.filter(page_id=page.id).count() == 1

        # Mutate the page, then re-run as the same user within the timeout.
        page.description_json = {"v": 2}
        page.description_html = "<p>v2</p>"
        page.save()

        previous_state = json.dumps({"description_html": "<p>v1</p>"})
        track_page_version(page.id, previous_state, user.id)

        versions = PageVersion.objects.filter(page_id=page.id)
        assert versions.count() == 1, "existing version should be updated in place"
        version = versions.first()
        assert version.description_json == {"v": 2}
        assert version.description_html == "<p>v2</p>"

    def test_noop_when_description_html_unchanged(self):
        """If ``description_html`` is unchanged, no version is written."""
        user = UserFactory()
        workspace = WorkspaceFactory(owner=user)
        page = _make_page(
            workspace,
            user,
            description_json={"v": 1},
            description_html="<p>same</p>",
        )

        unchanged_state = json.dumps({"description_html": "<p>same</p>"})
        track_page_version(page.id, unchanged_state, user.id)

        assert PageVersion.objects.filter(page_id=page.id).count() == 0

    def test_new_version_created_after_timeout(self):
        """An edit past PAGE_VERSION_TASK_TIMEOUT creates a fresh version
        rather than overwriting the previous one -- exercising the create
        branch a second time and confirming description_json is carried over.
        """
        user = UserFactory()
        workspace = WorkspaceFactory(owner=user)
        page = _make_page(
            workspace,
            user,
            description_json={"v": 1},
            description_html="<p>v1</p>",
        )

        track_page_version(page.id, None, user.id)
        first = PageVersion.objects.get(page_id=page.id)
        # Backdate the first version beyond the timeout window.
        stale = timezone.now() - timezone.timedelta(seconds=PAGE_VERSION_TASK_TIMEOUT + 1)
        PageVersion.objects.filter(pk=first.pk).update(last_saved_at=stale)

        page.description_json = {"v": 2}
        page.description_html = "<p>v2</p>"
        page.save()
        track_page_version(
            page.id, json.dumps({"description_html": "<p>v1</p>"}), user.id
        )

        versions = PageVersion.objects.filter(page_id=page.id).order_by("last_saved_at")
        assert versions.count() == 2
        assert versions.last().description_json == {"v": 2}


@pytest.mark.unit
class TestPageFieldName:
    def test_page_has_no_description_attribute(self):
        """Sentinel for the root cause: the Page model exposes
        ``description_json`` (and ``description_html``/``_binary``/``_stripped``)
        but no bare ``description`` field. Reading ``page.description`` -- as
        the buggy task did -- raises AttributeError.
        """
        assert not hasattr(Page, "description")
        assert hasattr(Page, "description_json")
