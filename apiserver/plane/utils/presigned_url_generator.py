import boto3
from django.conf import settings
from botocore.client import Config


def generate_download_presigned_url(
    key,
    expiration=3600,
    content_type="image/jpeg",
):
    """
    Generate a presigned URL to download an object from S3, dynamically setting
    the Content-Disposition based on the file metadata.
    """
    # Create a new S3 client
    if settings.USE_MINIO:
        s3_client = boto3.client(
            "s3",
            endpoint_url=f"{settings.AWS_S3_URL_PROTOCOL}//{str(settings.AWS_S3_CUSTOM_DOMAIN).replace(settings.AWS_STORAGE_BUCKET_NAME, '')}/",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
    else:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )

    try:
        # Generate a presigned URL for the object
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
                "ResponseContentType": content_type,
            },
            ExpiresIn=expiration,
        )

        # Return the presigned URL
        return url
    except Exception:
        return ""
