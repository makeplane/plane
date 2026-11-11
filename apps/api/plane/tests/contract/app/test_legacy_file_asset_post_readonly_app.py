# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""WEB-10023 / SEC-055: the legacy ``FileAssetEndpoint.post`` must not let the
client set identity/state fields (project, issue, entity_type, is_uploaded...)."""

from uuid import uuid4

import json

import pytest
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from plane.db.models import FileAsset, Project, ProjectMember

URL = "/api/workspaces/{slug}/file-assets/"


def _file(name):
    return SimpleUploadedFile(name, b"x", content_type="image/png")


@pytest.fixture(autouse=True)
def local_storage(monkeypatch, tmp_path):
    # The project's S3Storage can't back a FileField save in tests; use the filesystem.
    monkeypatch.setattr(FileAsset._meta.get_field("asset"), "storage", FileSystemStorage(location=str(tmp_path)))


@pytest.fixture
def other_project(db, workspace, create_user):
    project = Project.objects.create(name="Other", identifier="OT", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestLegacyFileAssetPostReadOnly:
    def test_forged_fields_are_ignored(self, session_client, workspace, other_project, create_user):
        other_ws = uuid4()
        resp = session_client.post(
            URL.format(slug=workspace.slug),
            {
                "asset": _file("forged.png"),
                "attributes": json.dumps({"name": "forged.png", "type": "image/png", "size": 1}),
                "is_uploaded": "true",
                "entity_type": FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                "entity_identifier": str(other_ws),
                "project": str(other_project.id),
                "user": str(create_user.id),
                "is_deleted": "true",
                "is_archived": "true",
                "external_id": "x",
                "external_source": "x",
                "size": 999999,
                "storage_metadata": json.dumps({"a": 1}),
            },
            format="multipart",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.content
        fa = FileAsset.objects.get(id=resp.data["id"])
        assert fa.workspace_id == workspace.id
        assert fa.project_id is None
        assert fa.issue_id is None and fa.user_id is None
        assert fa.is_uploaded is True  # server-set after the file is saved, not client-controlled
        assert fa.entity_type is None and fa.entity_identifier is None
        assert fa.is_deleted is False and fa.is_archived is False
        assert fa.external_id is None and fa.external_source is None
        assert fa.size == 1  # byte length of the uploaded file, not the forged 999999
        assert fa.storage_metadata == {}

    def test_normal_upload_works(self, session_client, workspace):
        resp = session_client.post(
            URL.format(slug=workspace.slug),
            {"asset": _file("ok.png"), "attributes": json.dumps({"name": "ok.png", "type": "image/png", "size": 5})},
            format="multipart",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.content
        fa = FileAsset.objects.get(id=resp.data["id"])
        assert fa.workspace_id == workspace.id
        assert fa.attributes["name"] == "ok.png"
        assert fa.size == 1 and fa.is_uploaded is True
