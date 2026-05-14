# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import io
import zipfile
from datetime import datetime
from typing import List
from uuid import UUID

import boto3
from botocore.client import Config

# Django imports
from django.conf import settings
from django.utils import timezone

# Module imports
from plane.db.models import ExporterHistory


def parse_date(value):
    """Parse a YYYY-MM-DD string to date, returns None on invalid input."""
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def create_zip_file(files: List[tuple[str, str | bytes]]) -> io.BytesIO:
    """Create a ZIP file from the provided files."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
        for filename, file_content in files:
            zipf.writestr(filename, file_content)
    zip_buffer.seek(0)
    return zip_buffer


def upload_bytes_and_presign(
    buffer: io.BytesIO,
    key: str,
    content_type: str,
    expires_in: int = 7 * 24 * 3600,
) -> str:
    """
    Upload arbitrary bytes to S3/MinIO using the given object key and content type.
    Returns a presigned GET URL valid for ``expires_in`` seconds.

    MinIO: upload via internal endpoint, presign via MINIO_EXTERNAL_ENDPOINT
    (allows browser-accessible URLs separate from internal Docker hostnames).
    AWS S3: single client for both upload and presign.
    """
    if settings.USE_MINIO:
        upload_s3 = boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        upload_s3.upload_fileobj(
            buffer,
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": content_type},
        )

        # Use MINIO_EXTERNAL_ENDPOINT for presign so URLs are browser-reachable.
        external_endpoint = getattr(settings, "MINIO_EXTERNAL_ENDPOINT", None) or settings.AWS_S3_ENDPOINT_URL
        presign_s3 = boto3.client(
            "s3",
            endpoint_url=external_endpoint,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
    else:
        if settings.AWS_S3_ENDPOINT_URL:
            presign_s3 = boto3.client(
                "s3",
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
            )
        else:
            presign_s3 = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
            )
        presign_s3.upload_fileobj(
            buffer,
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    presigned_url = presign_s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )
    return presigned_url


def upload_to_s3(zip_file: io.BytesIO, workspace_id: UUID, token_id: str, slug: str) -> None:
    """Upload a ZIP file to S3 and generate a presigned URL."""
    file_name = f"{workspace_id}/export-{slug}-{token_id[:6]}-{str(timezone.now().date())}.zip"
    expires_in = 7 * 24 * 60 * 60

    presigned_url = upload_bytes_and_presign(
        buffer=zip_file,
        key=file_name,
        content_type="application/zip",
        expires_in=expires_in,
    )

    exporter_instance = ExporterHistory.objects.get(token=token_id)

    if presigned_url:
        exporter_instance.url = presigned_url
        exporter_instance.status = "completed"
        exporter_instance.key = file_name
    else:
        exporter_instance.status = "failed"

    exporter_instance.save(update_fields=["status", "url", "key"])
