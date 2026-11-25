# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The legacy multipart upload routes store a file under the content type the client
declares, so they apply the checks the presigned (v2) routes do: the declared type
must be in ``ATTACHMENT_MIME_TYPES`` and the file within ``FILE_SIZE_LIMIT``."""

from unittest import mock

import pytest
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from plane.db.models import FileAsset, Issue, Project, ProjectMember

ROUTES = ["workspace", "user", "issue_attachment"]


@pytest.fixture(autouse=True)
def local_storage(monkeypatch, tmp_path):
    # Keep the uploads off the object store; save them to the filesystem.
    monkeypatch.setattr(FileAsset._meta.get_field("asset"), "storage", FileSystemStorage(location=str(tmp_path)))


@pytest.fixture
def urls(workspace, create_user):
    project = Project.objects.create(name="Uploads", identifier="UP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    issue = Issue.objects.create(name="issue", project=project, workspace=workspace)
    base = f"/api/workspaces/{workspace.slug}"
    return {
        "workspace": f"{base}/file-assets/",
        "user": "/api/users/file-assets/",
        "issue_attachment": f"{base}/projects/{project.id}/issues/{issue.id}/issue-attachments/",
    }


def _upload(client, url, name, content_type, content=b"x"):
    upload = SimpleUploadedFile(name, content, content_type=content_type)
    with (
        mock.patch("plane.app.views.issue.attachment.issue_activity"),
        mock.patch("plane.app.views.issue.attachment.base_host", return_value="http://testserver"),
    ):
        return client.post(url, {"asset": upload}, format="multipart")


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("route", ROUTES)
class TestLegacyUploadValidation:
    # An empty declared type would otherwise be stored as a guess from the file name.
    @pytest.mark.parametrize("content_type", ["text/html", ""])
    def test_type_outside_the_allowlist_is_rejected(self, session_client, urls, route, content_type):
        resp = _upload(session_client, urls[route], "page.html", content_type, b"<script>alert(1)</script>")

        assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content
        assert "asset" in resp.data
        assert not FileAsset.objects.exists()

    def test_allowed_type_is_stored(self, session_client, urls, route):
        resp = _upload(session_client, urls[route], "ok.png", "image/png")

        assert resp.status_code == status.HTTP_201_CREATED, resp.content
        assert FileAsset.objects.filter(id=resp.data["id"]).exists()

    def test_file_over_the_size_limit_is_rejected(self, session_client, urls, route, settings):
        settings.FILE_SIZE_LIMIT = 1

        resp = _upload(session_client, urls[route], "big.png", "image/png", b"xx")

        assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content
        assert "asset" in resp.data
        assert not FileAsset.objects.exists()
