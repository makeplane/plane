# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage


@pytest.fixture
def project(db, workspace, create_user):
    """A project in the test workspace with the test user as an active admin."""
    project = Project.objects.create(name="Docs", identifier="DOCS", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def pages_url(slug, project_id, page_id=None):
    """URL of the app-API page list or detail endpoint."""
    base = f"/api/workspaces/{slug}/projects/{project_id}/pages/"
    return f"{base}{page_id}/" if page_id else base


def page_action_url(slug, project_id, page_id, action):
    """URL of a page sub-action (archive, lock, access, description)."""
    return f"{pages_url(slug, project_id, page_id)}{action}/"


@pytest.mark.contract
class TestPageWebhookDispatch:
    """Creating or deleting a page through the app API fires a ``page`` webhook."""

    @pytest.fixture(autouse=True)
    def _web_url(self, settings):
        # base_host() needs an origin to build current_site; the value is
        # irrelevant to the assertions but must be a valid URL.
        """Give base_host() an origin to build current_site from."""
        settings.WEB_URL = "http://localhost"

    @pytest.mark.django_db
    def test_create_dispatches_page_webhook(self, session_client, workspace, project):
        """Creating a page fires the created webhook."""
        with (
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            mock.patch("plane.app.views.page.base.page_transaction"),
        ):
            response = session_client.post(
                pages_url(workspace.slug, project.id),
                {"name": "Runbook"},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        page_id = response.data["id"]
        assert Page.objects.filter(id=page_id).exists()
        assert ProjectPage.objects.filter(page_id=page_id, project=project).exists()

        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["verb"] == "created"
        assert str(kwargs["event_id"]) == str(page_id)
        assert kwargs["slug"] == workspace.slug

    @pytest.mark.django_db
    def test_create_does_not_dispatch_on_invalid_payload(self, session_client, workspace, project):
        """A failed create (serializer invalid) must not fire a webhook."""
        with (
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            mock.patch("plane.app.views.page.base.page_transaction"),
        ):
            response = session_client.post(
                pages_url(workspace.slug, project.id),
                {"access": "not-an-integer"},
                format="json",
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Page.objects.exists()
        mocked_webhook.delay.assert_not_called()

    @pytest.mark.django_db
    def test_destroy_dispatches_page_webhook(self, session_client, workspace, project, create_user):
        """Deleting a page fires the deleted webhook."""
        page = Page.objects.create(
            workspace=workspace,
            owned_by=create_user,
            name="Old Page",
            archived_at=timezone.now(),
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            created_by=create_user,
            updated_by=create_user,
        )

        with (
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            # page.delete() soft-deletes and enqueues a cascade task; stub it so
            # the test has no hidden broker dependency.
            mock.patch("plane.db.mixins.soft_delete_related_objects"),
        ):
            response = session_client.delete(pages_url(workspace.slug, project.id, page.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        assert not Page.objects.filter(id=page.id).exists()

        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["verb"] == "deleted"
        assert str(kwargs["event_id"]) == str(page.id)

    @pytest.mark.django_db
    def test_duplicate_dispatches_page_webhook(self, session_client, workspace, project, create_user):
        """Duplicating a page fires a created webhook for the copy."""
        page = Page.objects.create(
            workspace=workspace,
            owned_by=create_user,
            name="Template",
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            created_by=create_user,
            updated_by=create_user,
        )

        url = pages_url(workspace.slug, project.id, page.id) + "duplicate/"
        with (
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            mock.patch("plane.app.views.page.base.page_transaction"),
            mock.patch("plane.app.views.page.base.copy_s3_objects_of_description_and_assets"),
        ):
            response = session_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        new_page_id = response.data["id"]
        # The duplicate is a distinct new page.
        assert str(new_page_id) != str(page.id)

        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["verb"] == "created"
        assert str(kwargs["event_id"]) == str(new_page_id)

    @pytest.mark.django_db
    def test_destroy_requires_archived_page(self, session_client, workspace, project, create_user):
        """A non-archived page cannot be deleted, so no webhook fires."""
        page = Page.objects.create(
            workspace=workspace,
            owned_by=create_user,
            name="Live Page",
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            created_by=create_user,
            updated_by=create_user,
        )

        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = session_client.delete(pages_url(workspace.slug, project.id, page.id))

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Page.objects.filter(id=page.id).exists()
        mocked_webhook.delay.assert_not_called()


@pytest.mark.contract
class TestPageUpdateWebhookDispatch:
    """DRF-side page property + content changes fire a ``page`` update webhook."""

    @pytest.fixture(autouse=True)
    def _web_url(self, settings):
        """Give base_host() an origin to build current_site from."""
        settings.WEB_URL = "http://localhost"

    @pytest.fixture
    def page(self, db, workspace, project, create_user):
        """A page owned by the requesting user, linked to the project."""
        page = Page.objects.create(
            workspace=workspace,
            owned_by=create_user,
            name="Runbook",
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            created_by=create_user,
            updated_by=create_user,
        )
        return page

    @pytest.mark.django_db
    def test_rename_dispatches_update_via_model_activity(self, session_client, workspace, project, page):
        """A rename goes through model_activity, which diffs and fans out one
        ``page`` update webhook per changed field."""
        with (
            mock.patch("plane.app.views.page.base.model_activity") as mocked_model_activity,
            mock.patch("plane.app.views.page.base.page_transaction"),
        ):
            response = session_client.patch(
                pages_url(workspace.slug, project.id, page.id),
                {"name": "Renamed Runbook"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        mocked_model_activity.delay.assert_called_once()
        kwargs = mocked_model_activity.delay.call_args.kwargs
        assert kwargs["model_name"] == "page"
        assert str(kwargs["model_id"]) == str(page.id)
        assert kwargs["requested_data"] == {"name": "Renamed Runbook"}

    @pytest.mark.django_db
    def test_access_change_dispatches_update(self, session_client, workspace, project, page):
        """Changing access fires an update webhook."""
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = session_client.post(
                page_action_url(workspace.slug, project.id, page.id, "access"),
                {"access": 1},
                format="json",
            )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["verb"] == "updated"
        assert kwargs["field"] == "access"
        assert kwargs["new_value"] == 1
        assert str(kwargs["event_id"]) == str(page.id)

    @pytest.mark.django_db
    def test_lock_dispatches_update(self, session_client, workspace, project, page):
        """Locking fires an update webhook."""
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = session_client.post(page_action_url(workspace.slug, project.id, page.id, "lock"))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["verb"] == "updated"
        assert kwargs["field"] == "is_locked"
        assert kwargs["new_value"] is True

    @pytest.mark.django_db
    def test_unlock_dispatches_update(self, session_client, workspace, project, page):
        """Unlocking fires an update webhook."""
        page.is_locked = True
        page.save()
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = session_client.delete(page_action_url(workspace.slug, project.id, page.id, "lock"))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["verb"] == "updated"
        assert kwargs["field"] == "is_locked"
        assert kwargs["new_value"] is False

    @pytest.mark.django_db
    def test_archive_dispatches_update(self, session_client, workspace, project, page):
        """Archiving fires an update webhook."""
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = session_client.post(page_action_url(workspace.slug, project.id, page.id, "archive"))

        assert response.status_code == status.HTTP_200_OK
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["verb"] == "updated"
        assert kwargs["field"] == "archived_at"
        assert kwargs["new_value"] is not None

    @pytest.mark.django_db
    def test_unarchive_dispatches_update(self, session_client, workspace, project, page):
        """Restoring fires an update webhook."""
        page.archived_at = timezone.now()
        page.save()
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = session_client.delete(page_action_url(workspace.slug, project.id, page.id, "archive"))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["verb"] == "updated"
        assert kwargs["field"] == "archived_at"
        assert kwargs["new_value"] is None

    @pytest.mark.django_db
    def test_content_persist_dispatches_debounced_update(self, session_client, workspace, project, page):
        """The description (live content-persist) endpoint fires a debounced
        ``page`` update webhook."""
        with (
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            mock.patch("plane.app.views.page.base.page_transaction"),
            mock.patch("plane.app.views.page.base.track_page_version"),
        ):
            response = session_client.patch(
                page_action_url(workspace.slug, project.id, page.id, "description"),
                {"description_html": "<p>hello</p>"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["verb"] == "updated"
        assert kwargs["field"] == "description_html"
        # The live flush path is debounced so a session does not emit per flush.
        assert kwargs["debounce"] is True
        assert str(kwargs["event_id"]) == str(page.id)


@pytest.mark.contract
class TestPageContentUpdateRouting:
    """Content edits go down the debounced path, never the per-field one."""

    @pytest.fixture(autouse=True)
    def _web_url(self, settings):
        """Give base_host() an origin to build current_site from."""
        settings.WEB_URL = "http://localhost"

    @pytest.fixture
    def page(self, db, workspace, project, create_user):
        """A page owned by the requesting user, linked to the project."""
        page = Page.objects.create(
            workspace=workspace,
            owned_by=create_user,
            name="Runbook",
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
            created_by=create_user,
            updated_by=create_user,
        )
        return page

    @pytest.mark.django_db
    def test_content_edit_is_debounced_and_kept_out_of_model_activity(self, session_client, workspace, project, page):
        """A description_html edit must not fan out an undebounced per-field
        webhook through model_activity."""
        with (
            mock.patch("plane.app.views.page.base.model_activity") as mocked_model_activity,
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            mock.patch("plane.app.views.page.base.page_transaction"),
        ):
            response = session_client.patch(
                pages_url(workspace.slug, project.id, page.id),
                {"name": "Renamed", "description_html": "<p>new body</p>"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        # The property edit still goes through model_activity...
        mocked_model_activity.delay.assert_called_once()
        requested = mocked_model_activity.delay.call_args.kwargs["requested_data"]
        assert requested == {"name": "Renamed"}
        assert "description_html" not in requested
        # ...and the content edit rides the debounced content webhook.
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["field"] == "description_html"
        assert kwargs["debounce"] is True

    @pytest.mark.django_db
    def test_property_only_edit_does_not_fire_a_content_webhook(self, session_client, workspace, project, page):
        """A rename alone must not emit a content update."""
        with (
            mock.patch("plane.app.views.page.base.model_activity") as mocked_model_activity,
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
        ):
            response = session_client.patch(
                pages_url(workspace.slug, project.id, page.id),
                {"name": "Renamed only"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        mocked_model_activity.delay.assert_called_once()
        mocked_webhook.delay.assert_not_called()

    @pytest.mark.django_db
    def test_archive_refreshes_updated_at(self, session_client, workspace, project, page):
        """Archiving is a modification: the raw SQL must maintain updated_at."""
        Page.objects.filter(pk=page.id).update(updated_at=timezone.now() - timedelta(days=2))
        before = Page.objects.get(pk=page.id).updated_at

        response = session_client.post(page_action_url(workspace.slug, project.id, page.id, "archive"))

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.updated_at > before
        assert page.archived_at is not None
