# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
S3 storage module with dual-client architecture.

This module provides S3Storage, a Django storage backend that handles both
presigned URL generation and real S3 API calls using separate boto3 clients:

- s3_client: Internal endpoint for real S3 API operations (upload, copy, metadata, delete)
- _presign_client: Public endpoint for presigned URL generation (browser-accessible)

This separation ensures:
- Background tasks (Celery workers) can make real S3 API calls via internal endpoint
- Presigned URLs in emails/notifications use public endpoint accessible by browsers
"""

# Python imports
import logging
import os
import uuid

# Third party imports
import boto3
from botocore.exceptions import ClientError
from urllib.parse import quote, urlparse

# Module imports
from plane.utils.exception_logger import log_exception
from storages.backends.s3boto3 import S3Boto3Storage


class S3Storage(S3Boto3Storage):
    """
    S3 storage class that handles both presigned URL generation and real S3 API calls.

    Uses two separate boto3 clients:
    - s3_client: Internal endpoint for real S3 API operations (upload, copy, metadata, delete)
    - _presign_client: Public endpoint for presigned URL generation (browser-accessible)

    This separation ensures:
    - Background tasks (Celery workers) can make real S3 API calls via internal endpoint
    - Presigned URLs in emails/notifications use public endpoint accessible by browsers

    Note: super().__init__() is deliberately not called because all S3 operations
    go through self.s3_client / self._presign_client directly. Parent attributes
    like self.location are not needed for our use case.
    """

    def url(self, name, parameters=None, expire=None, http_method=None):
        """
        Override parent url() to return raw name.

        Presigned URLs are generated explicitly via generate_presigned_url(),
        so we never want Django storages auto-generating them here.
        """
        return name

    def _resolve_api_endpoint(self):
        """
        Resolve the internal endpoint for real S3 API calls.
        Always uses AWS_S3_ENDPOINT_URL / MINIO_ENDPOINT_URL.
        Falls back to localhost:9000 if not configured.
        """
        if self.aws_s3_endpoint_url:
            return self.aws_s3_endpoint_url
        # Last resort fallback for MinIO deployments
        protocol = "https" if os.environ.get("MINIO_ENDPOINT_SSL") == "1" else "http"
        return f"{protocol}://localhost:9000"

    def _resolve_public_endpoint(self, request=None):
        """
        Resolve the public endpoint for presigned URL generation.

        Priority chain:
        1. HTTP request context (browser-facing operations)
        2. WEB_URL env var (background tasks like email notifications)
        3. Environment config fallback (last resort)

        This assumes MinIO is exposed through the same domain as WEB_URL
        via reverse proxy path routing (e.g., /uploads/ -> MinIO).
        """
        # Non-MinIO deployments (AWS S3, R2, CloudFront) use their own endpoint
        if os.environ.get("USE_MINIO") != "1":
            return self.aws_s3_endpoint_url

        # Priority 1: HTTP request context (normal web requests)
        if request:
            return f"{request.scheme}://{request.get_host()}"

        # Priority 2: WEB_URL for background tasks (Celery workers, emails)
        web_url = os.environ.get("WEB_URL", "").strip().rstrip("/")
        if web_url:
            parsed = urlparse(web_url)
            # Validate the URL has scheme and hostname
            if parsed.scheme and parsed.hostname:
                # Use hostname (not netloc) to strip any credentials
                endpoint_host = parsed.hostname
                # Preserve non-standard ports
                if parsed.port and parsed.port not in (80, 443):
                    endpoint_host = f"{endpoint_host}:{parsed.port}"
                return f"{parsed.scheme}://{endpoint_host}"
            else:
                # Malformed WEB_URL - log sanitized warning and fall through
                logging.warning(
                    "WEB_URL is malformed (scheme=%r); falling back to internal endpoint",
                    parsed.scheme,
                )

        # Priority 3: Last resort - use environment config
        # This will likely break emails but at least uploads work
        endpoint_protocol = "https" if os.environ.get("MINIO_ENDPOINT_SSL") == "1" else "http"
        # Use hostname to strip credentials from the endpoint URL too
        endpoint_parsed = urlparse(self.aws_s3_endpoint_url) if self.aws_s3_endpoint_url else None
        endpoint_host = endpoint_parsed.hostname if endpoint_parsed and endpoint_parsed.hostname else "localhost:9000"
        if endpoint_parsed and endpoint_parsed.port and endpoint_parsed.port not in (80, 443):
            endpoint_host = f"{endpoint_host}:{endpoint_parsed.port}"

        logging.warning("WEB_URL not set; using internal MinIO endpoint for presigned URLs")

        return f"{endpoint_protocol}://{endpoint_host}"

    def __init__(self, request=None, **kwargs):
        """
        Initialize S3Storage with dual clients.

        Args:
            request: HTTP request object (optional). Used to determine public endpoint.
            **kwargs: Absorbs unknown kwargs (like is_server) to prevent TypeError crashes.
                     Unknown kwargs are logged as warnings.
        """
        # Absorb any unexpected kwargs (like is_server) to prevent TypeError crashes
        # This handles legacy call sites that pass is_server=True
        unknown_kwargs = set(kwargs.keys())
        if unknown_kwargs:
            logging.warning("S3Storage received unknown kwargs: %s (ignored)", unknown_kwargs)

        # Get the AWS credentials and bucket name from the environment
        self.aws_access_key_id = os.environ.get("AWS_ACCESS_KEY_ID")
        self.aws_secret_access_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
        self.aws_storage_bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
        self.aws_region = os.environ.get("AWS_REGION")
        self.aws_s3_endpoint_url = os.environ.get("AWS_S3_ENDPOINT_URL") or os.environ.get("MINIO_ENDPOINT_URL")
        self.signed_url_expiration = int(os.environ.get("SIGNED_URL_EXPIRATION", "3600"))

        # Resolve endpoints
        api_endpoint = self._resolve_api_endpoint()
        public_endpoint = self._resolve_public_endpoint(request)

        # Create API client: always uses internal endpoint for real S3 operations
        # (upload, copy, metadata, delete)
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key,
            region_name=self.aws_region,
            endpoint_url=api_endpoint,
            config=boto3.session.Config(signature_version="s3v4"),
        )

        # Create presign client: uses public endpoint for presigned URL generation
        # (browser-accessible URLs for emails, downloads, etc.)
        self._presign_client = boto3.client(
            "s3",
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key,
            region_name=self.aws_region,
            endpoint_url=public_endpoint,
            config=boto3.session.Config(signature_version="s3v4"),
        )

    def generate_presigned_post(self, object_name, file_type, file_size, expiration=None):
        """Generate a presigned URL to upload an S3 object"""
        if expiration is None:
            expiration = self.signed_url_expiration
        fields = {"Content-Type": file_type}

        conditions = [
            {"bucket": self.aws_storage_bucket_name},
            ["content-length-range", 1, file_size],
            {"Content-Type": file_type},
        ]

        # Add condition for the object name (key)
        if object_name.startswith("${filename}"):
            conditions.append(["starts-with", "$key", object_name[: -len("${filename}")]])
        else:
            fields["key"] = object_name
            conditions.append({"key": object_name})

        # Generate the presigned POST URL using the presign client (public endpoint)
        try:
            response = self._presign_client.generate_presigned_post(
                Bucket=self.aws_storage_bucket_name,
                Key=object_name,
                Fields=fields,
                Conditions=conditions,
                ExpiresIn=expiration,
            )
        except ClientError as e:
            log_exception(e)
            return None

        return response

    def _get_content_disposition(self, disposition, filename=None):
        """Helper method to generate Content-Disposition header value"""
        if filename is None:
            filename = uuid.uuid4().hex

        if filename:
            # Encode the filename to handle special characters
            encoded_filename = quote(filename)
            return f"{disposition}; filename*=UTF-8''{encoded_filename}"
        return disposition

    def generate_presigned_url(
        self,
        object_name,
        expiration=None,
        http_method="GET",
        disposition="inline",
        filename=None,
    ):
        """Generate a presigned URL to share an S3 object"""
        if expiration is None:
            expiration = self.signed_url_expiration
        content_disposition = self._get_content_disposition(disposition, filename)
        try:
            # Use the presign client (public endpoint) for presigned URL generation
            response = self._presign_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.aws_storage_bucket_name,
                    "Key": str(object_name),
                    "ResponseContentDisposition": content_disposition,
                },
                ExpiresIn=expiration,
                HttpMethod=http_method,
            )
        except ClientError as e:
            log_exception(e)
            return None

        # The response contains the presigned URL
        return response

    def get_object_metadata(self, object_name):
        """Get the metadata for an S3 object"""
        try:
            # Use the API client (internal endpoint) for real S3 operations
            response = self.s3_client.head_object(Bucket=self.aws_storage_bucket_name, Key=object_name)
        except ClientError as e:
            log_exception(e)
            return None

        return {
            "ContentType": response.get("ContentType"),
            "ContentLength": response.get("ContentLength"),
            "LastModified": (response.get("LastModified").isoformat() if response.get("LastModified") else None),
            "ETag": response.get("ETag"),
            "Metadata": response.get("Metadata", {}),
        }

    def copy_object(self, object_name, new_object_name):
        """Copy an S3 object to a new location"""
        try:
            # Use the API client (internal endpoint) for real S3 operations
            response = self.s3_client.copy_object(
                Bucket=self.aws_storage_bucket_name,
                CopySource={"Bucket": self.aws_storage_bucket_name, "Key": object_name},
                Key=new_object_name,
            )
        except ClientError as e:
            log_exception(e)
            return None

        return response

    def upload_file(
        self,
        file_obj,
        object_name: str,
        content_type: str = None,
        extra_args: dict = None,
    ) -> bool:
        """Upload a file directly to S3"""
        if extra_args is None:
            extra_args = {}
        try:
            if content_type:
                extra_args["ContentType"] = content_type

            # Use the API client (internal endpoint) for real S3 operations
            self.s3_client.upload_fileobj(
                file_obj,
                self.aws_storage_bucket_name,
                object_name,
                ExtraArgs=extra_args,
            )
            return True
        except ClientError as e:
            log_exception(e)
            return False

    def delete_files(self, object_names):
        """Delete an S3 object"""
        try:
            # Use the API client (internal endpoint) for real S3 operations
            self.s3_client.delete_objects(
                Bucket=self.aws_storage_bucket_name,
                Delete={"Objects": [{"Key": object_name} for object_name in object_names]},
            )
            return True
        except ClientError as e:
            log_exception(e)
            return False
