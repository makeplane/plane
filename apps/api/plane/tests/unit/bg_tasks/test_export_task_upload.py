# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""upload_to_s3: the export is uploaded as a private object, reachable only through
the presigned URL, under a key that carries the full export token."""

import io
from unittest.mock import patch

import pytest

from plane.bgtasks.export_task import upload_to_s3
from plane.db.models import ExporterHistory

pytestmark = pytest.mark.unit


@pytest.mark.django_db
@pytest.mark.parametrize("use_minio", [True, False])
def test_export_upload_is_private_and_keyed_by_full_token(settings, workspace, create_user, use_minio):
    settings.USE_MINIO = use_minio
    settings.AWS_S3_URL_PROTOCOL = "http:"
    settings.AWS_S3_CUSTOM_DOMAIN = "localhost/uploads"
    exporter = ExporterHistory.objects.create(workspace=workspace, initiated_by=create_user, provider="json")

    with patch("plane.bgtasks.export_task.boto3") as boto3:
        client = boto3.client.return_value
        client.generate_presigned_url.return_value = "https://example.com/export.zip"
        upload_to_s3(io.BytesIO(b"zip"), workspace.id, exporter.token, workspace.slug)

    key = client.upload_fileobj.call_args.args[2]
    assert exporter.token in key
    assert "ACL" not in client.upload_fileobj.call_args.kwargs["ExtraArgs"]
    exporter.refresh_from_db()
    assert exporter.key == key
    assert exporter.status == "completed"
