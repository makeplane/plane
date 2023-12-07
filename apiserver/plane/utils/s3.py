import re
import boto3
from botocore.client import Config
from urllib.parse import urlparse

from django.conf import settings


class S3:
    def __init__(self):
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
            Params={"Bucket": settings.AWS_S3_BUCKET_NAME, "Key": path},
        )

        return url

    @staticmethod
    def verify_s3_url(url):
        pattern = re.compile(r"amazonaws\.com")
        return pattern.search(url)
