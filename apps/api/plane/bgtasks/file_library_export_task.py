# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unbounded file-library ZIP export, following the issue-exporter pattern:
an ExporterHistory row tracks the job, the ZIP is assembled on the worker
(disk-backed, streamed from S3 file by file), uploaded back to S3 and served
through a 7-day presigned URL. The existing delete_old_s3_link scheduled task
cleans the object up after 8 days like any other export.
"""

import tempfile
import uuid
import zipfile

from celery import shared_task
from django.utils import timezone

from plane.utils.exception_logger import log_exception

EXPORT_URL_EXPIRY_SECONDS = 7 * 24 * 3600


def _unique_name(name, used):
    candidate, counter = name or "archivo", 2
    while candidate in used:
        dot = name.rfind(".")
        candidate = f"{name[:dot]} ({counter}){name[dot:]}" if dot > 0 else f"{name} ({counter})"
        counter += 1
    used.add(candidate)
    return candidate


@shared_task
def file_library_export_task(exporter_id):
    from plane.db.models import ExporterHistory, FileAsset
    from plane.settings.storage import S3Storage
    from plane.utils.path_validator import sanitize_filename

    exporter = ExporterHistory.objects.filter(id=exporter_id).first()
    if exporter is None:
        return

    try:
        exporter.status = "processing"
        exporter.save(update_fields=["status"])

        asset_ids = (exporter.filters or {}).get("asset_ids") or []
        assets = FileAsset.objects.filter(
            id__in=asset_ids,
            workspace_id=exporter.workspace_id,
            entity_type=FileAsset.EntityTypeContext.WORKSPACE_FILE_LIBRARY,
            is_uploaded=True,
            is_deleted=False,
        )

        storage = S3Storage()
        bucket = storage.aws_storage_bucket_name
        used_names = set()

        # Disk-backed ZIP: each S3 object streams straight into the archive,
        # so memory stays flat no matter how many files are exported.
        with tempfile.TemporaryFile() as scratch:
            with zipfile.ZipFile(scratch, "w", zipfile.ZIP_STORED, allowZip64=True) as archive:
                for asset in assets.iterator():
                    entry_name = _unique_name(
                        sanitize_filename((asset.attributes or {}).get("name") or str(asset.id)), used_names
                    )
                    body = storage.s3_client.get_object(Bucket=bucket, Key=asset.asset.name)["Body"]
                    try:
                        with archive.open(entry_name, "w") as destination:
                            for chunk in body.iter_chunks(chunk_size=1024 * 1024):
                                destination.write(chunk)
                    finally:
                        body.close()

            scratch.seek(0)
            date = timezone.now().date().isoformat()
            key = f"exports/{exporter.workspace_id}/{uuid.uuid4().hex}-archivos-{date}.zip"
            storage.s3_client.upload_fileobj(
                scratch,
                bucket,
                key,
                ExtraArgs={
                    "ContentType": "application/zip",
                    "ContentDisposition": f'attachment; filename="archivos-{date}.zip"',
                },
            )

        exporter.key = key
        exporter.url = storage.s3_presigned_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=EXPORT_URL_EXPIRY_SECONDS,
        )
        exporter.status = "completed"
        exporter.save(update_fields=["key", "url", "status"])
    except Exception as e:
        exporter.status = "failed"
        exporter.reason = str(e)[:500]
        exporter.save(update_fields=["status", "reason"])
        log_exception(e)
