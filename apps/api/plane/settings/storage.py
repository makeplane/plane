# Python imports
import os
import uuid
import base64
import time
import hashlib
import json
import hmac
from datetime import datetime

# Third party imports
import boto3
from botocore.exceptions import ClientError
from urllib.parse import quote

# Module imports
from django.conf import settings
from plane.utils.exception_logger import log_exception
from storages.backends.s3boto3 import S3Boto3Storage


class S3Storage(S3Boto3Storage):
    file_overwrite = True

    def url(self, name, parameters=None, expire=None, http_method=None):
        return name

    """S3 storage class to generate presigned URLs for S3 objects"""

    def __init__(self, request=None, is_server=False):
        # Get the AWS credentials and bucket name from the environment
        self.aws_access_key_id = os.environ.get("AWS_ACCESS_KEY_ID")
        # Use the AWS_SECRET_ACCESS_KEY environment variable for the secret key
        self.aws_secret_access_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
        # Use the AWS_S3_BUCKET_NAME environment variable for the bucket name
        self.aws_storage_bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
        # Use the AWS_REGION environment variable for the region
        self.aws_region = os.environ.get("AWS_REGION")
        # Use the AWS_S3_ENDPOINT_URL environment variable for the endpoint URL
        self.aws_s3_endpoint_url = os.environ.get(
            "AWS_S3_ENDPOINT_URL"
        ) or os.environ.get("MINIO_ENDPOINT_URL")

        # Use the USE_STORAGE_PROXY environment variable for the storage proxy
        self.use_storage_proxy = settings.USE_STORAGE_PROXY
        self.request = request

        if os.environ.get("USE_MINIO") == "1":
            # Determine protocol based on environment variable
            if os.environ.get("MINIO_ENDPOINT_SSL") == "1":
                endpoint_protocol = "https"
            else:
                endpoint_protocol = request.scheme if request else "http"
            # Create an S3 client for MinIO

            if is_server:
                # Create an S3 client for MinIO
                self.s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=self.aws_access_key_id,
                    aws_secret_access_key=self.aws_secret_access_key,
                    region_name=self.aws_region,
                    endpoint_url=self.aws_s3_endpoint_url,
                    config=boto3.session.Config(signature_version="s3v4"),
                )
            else:
                # Create an S3 client for MinIO
                self.s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=self.aws_access_key_id,
                    aws_secret_access_key=self.aws_secret_access_key,
                    region_name=self.aws_region,
                    endpoint_url=(
                        f"{endpoint_protocol}://{request.get_host()}"
                        if request
                        else self.aws_s3_endpoint_url
                    ),
                    config=boto3.session.Config(signature_version="s3v4"),
                )
        else:
            # Create an S3 client
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key,
                region_name=self.aws_region,
                endpoint_url=self.aws_s3_endpoint_url,
                config=boto3.session.Config(signature_version="s3v4"),
            )

    def generate_presigned_post(
        self, object_name, file_type, file_size, expiration=3600
    ):
        """Generate a presigned URL to upload an S3 object"""
        fields = {"Content-Type": file_type}

        conditions = [
            {"bucket": self.aws_storage_bucket_name},
            ["content-length-range", 1, file_size],
            {"Content-Type": file_type},
        ]

        # Add condition for the object name (key)
        if object_name.startswith("${filename}"):
            conditions.append(
                ["starts-with", "$key", object_name[: -len("${filename}")]]
            )
        else:
            fields["key"] = object_name
            conditions.append({"key": object_name})

        # Generate the presigned POST URL
        try:
            # Generate a presigned URL for the S3 object
            response = self.s3_client.generate_presigned_post(
                Bucket=self.aws_storage_bucket_name,
                Key=object_name,
                Fields=fields,
                Conditions=conditions,
                ExpiresIn=expiration,
            )
        # Handle errors
        except ClientError as e:
            print(f"Error generating presigned POST URL: {e}")
            return None

        if self.use_storage_proxy:
            # Store the original S3 URL in the fields so proxy can use it
            original_s3_url = response["url"]

            # Encode the original S3 URL and pass it to proxy
            encoded_s3_url = base64.urlsafe_b64encode(original_s3_url.encode()).decode()

            # Build proxy URL
            scheme = self.request.scheme if self.request else "https"
            host = self.request.get_host() if self.request else "localhost"
            proxy_url = f"{scheme}://{host}/api/assets/proxy-upload/{encoded_s3_url}/"

            # Replace only the URL with proxy URL, keep all AWS fields intact
            response["url"] = proxy_url

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

    def _generate_proxy_download_url(
        self, object_name, expiration=3600, disposition="inline", filename=None
    ):
        """Generate a proxy download URL"""
        if not self.request:
            return None

        # Create download parameters
        download_params = {
            "object_name": object_name,
            "expires_at": int(time.time()) + expiration,
            "disposition": disposition,
            "filename": filename,
        }

        # Generate a signature for security
        params_json = json.dumps(download_params, sort_keys=True)
        signature = hashlib.sha256(
            f"{params_json}{settings.SECRET_KEY}".encode()
        ).hexdigest()
        download_params["signature"] = signature

        # Base64 encode the parameters
        encoded_params = base64.urlsafe_b64encode(
            json.dumps(download_params).encode()
        ).decode()

        # Build proxy URL
        scheme = self.request.scheme if self.request else "https"
        host = self.request.get_host() if self.request else "localhost"
        return f"{scheme}://{host}/api/assets/proxy-download/{encoded_params}/"

    def generate_presigned_url(
        self,
        object_name,
        expiration=3600,
        http_method="GET",
        disposition="inline",
        filename=None,
    ):
        content_disposition = self._get_content_disposition(disposition, filename)

        if self.use_storage_proxy:
            return self._generate_proxy_download_url(
                object_name, expiration, disposition, filename
            )

        """Generate a presigned URL to share an S3 object"""
        try:
            response = self.s3_client.generate_presigned_url(
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
            response = self.s3_client.head_object(
                Bucket=self.aws_storage_bucket_name, Key=object_name
            )
        except ClientError as e:
            log_exception(e)
            return None

        return {
            "ContentType": response.get("ContentType"),
            "ContentLength": response.get("ContentLength"),
            "LastModified": (
                response.get("LastModified").isoformat()
                if response.get("LastModified")
                else None
            ),
            "ETag": response.get("ETag"),
            "Metadata": response.get("Metadata", {}),
        }

    def copy_object(self, object_name, new_object_name):
        """Copy an S3 object to a new location"""
        try:
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
        extra_args: dict = {},
    ) -> bool:
        """Upload a file directly to S3"""
        try:
            if content_type:
                extra_args["ContentType"] = content_type

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
            self.s3_client.delete_objects(
                Bucket=self.aws_storage_bucket_name,
                Delete={
                    "Objects": [{"Key": object_name} for object_name in object_names]
                },
            )
            return True
        except ClientError as e:
            log_exception(e)
            return False

    def get_object_stream(self, object_name, content_disposition):
        """Get an S3 object"""
        try:
            response = self.s3_client.get_object(
                Bucket=self.aws_storage_bucket_name,
                Key=object_name,
                ResponseContentDisposition=content_disposition,
            )
        except ClientError as e:
            log_exception(e)
            return None
        return response

    def _validate_aws_policy_signature(self, policy_b64, signature, aws_secret_key):
        """
        🔒 Security: Validate AWS policy signature using HMAC-SHA256
        This is critical - without this, attackers can forge policies
        """
        try:
            # Compute expected signature using AWS secret key
            expected_signature = base64.b64encode(
                hmac.new(
                    aws_secret_key.encode("utf-8"),
                    policy_b64.encode("utf-8"),
                    hashlib.sha256,
                ).digest()
            ).decode("utf-8")

            # Use constant-time comparison to prevent timing attacks
            return hmac.compare_digest(expected_signature, signature)

        except Exception as e:
            log_exception(e)
            return False

    def validate_upload_policy(self, policy_b64, signature=None):
        """
        🔒 Security: Comprehensive policy validation
        """
        try:
            # Decode and parse policy
            policy_json = base64.b64decode(policy_b64.encode()).decode("utf-8")
            policy = json.loads(policy_json)

            # 1. Validate expiration
            expiration_str = policy.get("expiration")
            if not expiration_str:
                return False, "Policy validation failed"

            try:
                expiration_dt = datetime.strptime(expiration_str, "%Y-%m-%dT%H:%M:%SZ")
                expiration_timestamp = int(expiration_dt.timestamp())
            except ValueError:
                return False, "Policy validation failed"

            current_time = int(time.time())

            # Check if policy has expired (with 5-minute grace period)
            if expiration_timestamp <= (current_time - 300):
                return False, "Policy validation failed"

            # 2. Validate policy conditions
            conditions = policy.get("conditions", [])
            if not conditions:
                return False, "Policy validation failed"

            # 3. Check bucket restriction
            bucket_found = False
            size_limit_found = False

            for condition in conditions:
                if (
                    isinstance(condition, dict)
                    and condition.get("bucket") == self.aws_storage_bucket_name
                ):
                    bucket_found = True
                elif isinstance(condition, list) and len(condition) == 3:
                    if condition[0] == "content-length-range":
                        max_size = condition[2]
                        max_file_size = getattr(
                            settings, "FILE_SIZE_LIMIT", 50 * 1024 * 1024
                        )
                        if max_size <= max_file_size:
                            size_limit_found = True

            if not bucket_found or not size_limit_found:
                return False, "Policy validation failed"

            # 4. Validate signature if provided (for AWS presigned POST)
            if signature and not self._validate_aws_policy_signature(
                policy_b64, signature, self.aws_secret_access_key
            ):
                return False, "Policy validation failed"

            return True, None
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as e:
            log_exception(e)
            return False, "Policy validation failed"
        except Exception as e:
            log_exception(e)
            return False, "Policy validation failed"

    def validate_download_params(self, encoded_params):
        """
        🔒 Security: Validate and decode download parameters with signature verification
        """
        try:
            # Decode base64 parameters
            params_json = base64.urlsafe_b64decode(encoded_params.encode()).decode()
            params = json.loads(params_json)

            # 1. Check required fields
            required_fields = ["object_name", "expires_at", "signature"]
            if not all(field in params for field in required_fields):
                return None, "Invalid parameters"

            # 2. Check expiration with grace period (5 minutes)
            current_time = int(time.time())
            if params.get("expires_at", 0) < (current_time - 300):
                return None, "Access token expired"

            # 3. Validate object name to prevent path traversal
            object_name = params.get("object_name", "")
            if not object_name or "../" in object_name or object_name.startswith("/"):
                return None, "Invalid object name"

            # 4. Validate signature using HMAC for better security
            params_copy = params.copy()
            provided_signature = params_copy.pop("signature", "")

            # Create expected signature using the same method as generation
            params_json = json.dumps(params_copy, sort_keys=True)
            expected_signature = hashlib.sha256(
                f"{params_json}{settings.SECRET_KEY}".encode()
            ).hexdigest()

            # Use constant-time comparison to prevent timing attacks
            if not hmac.compare_digest(provided_signature, expected_signature):
                return None, "Invalid signature"

            return params, None

        except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as e:
            log_exception(e)
            return None, "Invalid parameters"
        except Exception as e:
            log_exception(e)
            return None, "Invalid parameters"
