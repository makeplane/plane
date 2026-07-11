# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

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
    base = f"/api/workspaces/{slug}/projects/{project_id}/pages/"
    return f"{base}{page_id}/" if page_id else base


@pytest.mark.contract
class TestPageWebhookDispatch:
    """Creating or deleting a page through the app API fires a ``page`` webhook."""

    @pytest.fixture(autouse=True)
    def _web_url(self, settings):
        # base_host() needs an origin to build current_site; the value is
        # irrelevant to the assertions but must be a valid URL.
        settings.WEB_URL = "http://localhost"

    @pytest.mark.django_db
    def test_create_dispatches_page_webhook(self, session_client, workspace, project):
        with (
            mock.patch("plane.app.views.page.base.webhook_activity") as mocked_webhook,
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
            mock.patch("plane.app.views.page.base.webhook_activity") as mocked_webhook,
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
            mock.patch("plane.app.views.page.base.webhook_activity") as mocked_webhook,
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
            mock.patch("plane.app.views.page.base.webhook_activity") as mocked_webhook,
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

        with mock.patch("plane.app.views.page.base.webhook_activity") as mocked_webhook:
            response = session_client.delete(pages_url(workspace.slug, project.id, page.id))

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Page.objects.filter(id=page.id).exists()
        mocked_webhook.delay.assert_not_called()
