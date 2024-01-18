import re
import boto3
from botocore.client import Config
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone

from django.conf import settings


class S3:
    """class for manage s3 operations (upload, delete, refresh url file)"""

    def __init__(self):
        if settings.USE_MINIO:
            self.client = boto3.client(
                "s3",
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version=settings.AWS_S3_SIGNATURE_VERSION),
            )
        else:
            self.client = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version=settings.AWS_S3_SIGNATURE_VERSION),
            )

    def refresh_url(self, old_url, time=settings.AWS_S3_MAX_AGE_SECONDS):
        path = urlparse(str(old_url)).path.lstrip("/")

        url = self.client.generate_presigned_url(
            ClientMethod="get_object",
            ExpiresIn=time,
            Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": path},
        )

        if settings.USE_MINIO:
            url = url.replace(
                "http://plane-minio:9000/uploads/",
                f"{settings.AWS_S3_URL_PROTOCOL}//{settings.AWS_S3_CUSTOM_DOMAIN}/",
            )

        return url

    def upload_file(self, file, bucket_name, file_name, acl, content_type):
        self.client.upload_fileobj(
            file,
            bucket_name,
            file_name,
            ExtraArgs={"ACL": acl, "ContentType": content_type},
        )

    def delete_file(self, bucket_name, path):
        self.client.delete_object(Bucket=bucket_name, Key=path)

    @staticmethod
    def verify_s3_url(url):
        if url:
            pattern = re.compile(r"amazonaws\.com")
            return pattern.search(url)
        return False

    @staticmethod
    def url_file_has_expired(url, date_format="%Y%m%dT%H%M%SZ"):
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        x_amz_date = query_params.get("X-Amz-Date", [None])[0]

        x_amz_date_to_date = datetime.strptime(x_amz_date, date_format).replace(
            tzinfo=timezone.utc
        )
        actual_date = datetime.now(timezone.utc)
        seconds_difference = (actual_date - x_amz_date_to_date).total_seconds()

        return seconds_difference >= (settings.AWS_S3_MAX_AGE_SECONDS - 20)
