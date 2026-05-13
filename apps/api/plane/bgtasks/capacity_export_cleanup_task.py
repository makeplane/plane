# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging

# Third party imports
import boto3
from botocore.client import Config
from celery import shared_task

# Django imports
from django.conf import settings
from django.utils import timezone

# Module imports
from plane.db.models import CapacityExportJob
from plane.utils.exception_logger import log_exception

logger = logging.getLogger(__name__)


def _build_s3_client():
    """Build boto3 S3 client, selecting MinIO or AWS path (mirrors export_utils.py)."""
    if settings.USE_MINIO:
        return boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
    if settings.AWS_S3_ENDPOINT_URL:
        return boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


@shared_task
def cleanup_expired_capacity_exports():
    """
    Delete S3 objects for expired CapacityExportJob rows and mark them as expired.

    Idempotent — safe to re-run. Operates only on rows where:
      status='ready' AND expires_at < now()
    """
    qs = CapacityExportJob.objects.filter(
        status="ready",
        expires_at__lt=timezone.now(),
    )

    s3 = _build_s3_client()
    bucket = settings.AWS_STORAGE_BUCKET_NAME

    processed = 0
    deleted = 0
    failed = 0

    for job in qs.iterator(chunk_size=500):
        processed += 1

        # Best-effort S3 delete — failure does NOT block the DB update.
        if job.file_key:
            try:
                s3.delete_object(Bucket=bucket, Key=job.file_key)
                deleted += 1
            except Exception as e:
                log_exception(e)
                failed += 1

        # Always mark expired regardless of S3 outcome.
        job.status = "expired"
        job.file_url = ""
        job.save(update_fields=["status", "file_url", "updated_at"])

    logger.info(
        "capacity_export_cleanup processed=%d deleted=%d failed=%d",
        processed,
        deleted,
        failed,
    )
