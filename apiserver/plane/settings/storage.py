import os
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
from urllib.parse import urlparse

class PublicS3Storage(S3Boto3Storage):
    """Configuration for the Public bucket storage"""
    bucket_name = settings.AWS_PUBLIC_STORAGE_BUCKET_NAME
    default_acl = settings.AWS_PUBLIC_DEFAULT_ACL
    object_parameters = settings.AWS_S3_PUBLIC_OBJECT_PARAMETERS
    querystring_auth = False

    # For self hosted docker and minio
    if settings.DOCKERIZED and settings.USE_MINIO:
        parsed_url = urlparse(settings.WEB_URL)
        custom_domain = f"{parsed_url.netloc}/{settings.bucket_name}"
        url_protocol = f"{parsed_url.scheme}:"



class PrivateS3Storage(S3Boto3Storage):
    """Configuration for the Private bucket storage"""
    bucket_name = settings.AWS_PRIVATE_STORAGE_BUCKET_NAME
    default_acl = settings.AWS_PRIVATE_DEFAULT_ACL
    file_overwrite = settings.AWS_S3_PRIVATE_FILE_OVERWRITE
    region_name = settings.AWS_REGION_NAME
    addressing_style = settings.AWS_S3_ADDRESSING_STYLE

    # For self hosted docker and minio
    if settings.DOCKERIZED and settings.USE_MINIO:
        parsed_url = urlparse(settings.WEB_URL)
        custom_domain = f"{parsed_url.netloc}/{settings.bucket_name}"
        url_protocol = f"{parsed_url.scheme}:"
