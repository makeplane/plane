# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the attachment MIME type allowlist on work items.

``text/html`` and ``application/xhtml+xml`` are accepted for upload. They stay
safe because they are members of ``SCRIPT_CAPABLE_MIME_TYPES``, which pins every
asset download path to ``Content-Disposition: attachment`` (#9312 /
GHSA-ch8j-vr4r-qf6h), so the browser never renders them inline on the
application's origin.
"""

from unittest import mock

import pytest
from django.conf import settings
from rest_framework import status

from plane.db.models import FileAsset, Issue, Project, ProjectMember

HTML_MIME_TYPES = ["text/html", "application/xhtml+xml"]


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue(db, workspace, project, create_user):
    return Issue.objects.create(
        name="Test Work Item",
        workspace=workspace,
        project=project,
        created_by=create_user,
    )


@pytest.mark.contract
class TestIssueAttachmentMimeTypes:
    def list_url(self, workspace, project, issue):
        return f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/attachments/"

    def detail_url(self, workspace, project, issue, asset_id):
        return f"{self.list_url(workspace, project, issue)}{asset_id}/"

    @pytest.mark.django_db
    @pytest.mark.parametrize("mime_type", HTML_MIME_TYPES)
    def test_html_upload_is_accepted(self, session_client, workspace, project, issue, mime_type):
        """An HTML attachment must be allowed instead of rejected as an invalid file type."""
        url = self.list_url(workspace, project, issue)
        payload = {"name": "report.html", "type": mime_type, "size": 1024}

        with mock.patch("plane.app.views.issue.attachment.S3Storage") as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {"url": "x", "fields": {}}
            response = session_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        asset = FileAsset.objects.get(id=response.data["asset_id"])
        assert asset.attributes["type"] == mime_type

    @pytest.mark.django_db
    def test_unlisted_mime_type_is_still_rejected(self, session_client, workspace, project, issue):
        """Negative control: the allowlist still turns away types outside it."""
        url = self.list_url(workspace, project, issue)
        payload = {"name": "payload.hta", "type": "application/hta", "size": 1024}

        response = session_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST, f"Got {response.status_code}: {response.data!r}"
        assert FileAsset.objects.filter(issue=issue).count() == 0

    @pytest.mark.django_db
    @pytest.mark.parametrize("mime_type", HTML_MIME_TYPES)
    def test_html_download_is_served_as_an_attachment(
        self, session_client, workspace, project, issue, create_user, mime_type
    ):
        """HTML must be handed out as a download, never rendered inline."""
        asset = FileAsset.objects.create(
            attributes={"name": "report.html", "type": mime_type, "size": 1024},
            asset=f"{workspace.id}/report.html",
            size=1024,
            workspace=workspace,
            project=project,
            issue=issue,
            created_by=create_user,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            is_uploaded=True,
            storage_metadata={"size": 1024},
        )
        url = self.detail_url(workspace, project, issue, asset.id)

        with mock.patch("plane.app.views.issue.attachment.S3Storage") as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = "https://signed.example/download"
            response = session_client.get(url)

        assert response.status_code == status.HTTP_302_FOUND, f"Got {response.status_code}"
        call_kwargs = mock_storage.return_value.generate_presigned_url.call_args[1]
        assert call_kwargs["disposition"] == "attachment"

    @pytest.mark.parametrize("mime_type", HTML_MIME_TYPES)
    def test_html_is_script_capable(self, mime_type):
        """The upload allowlist entry is only safe while the type stays script-capable.

        ``SCRIPT_CAPABLE_MIME_TYPES`` is what makes the asset download endpoints
        choose ``attachment`` over ``inline``; dropping a type from it while it
        remains uploadable would reopen the stored-XSS path closed by #9312.
        """
        assert mime_type in settings.ATTACHMENT_MIME_TYPES
        assert mime_type in settings.SCRIPT_CAPABLE_MIME_TYPES
