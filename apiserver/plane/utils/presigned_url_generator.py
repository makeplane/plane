import boto3
from django.conf import settings


def generate_download_presigned_url(key, expiration=3600, host="localhost", scheme="http"):

    """
    Generate a presigned URL to download an object from S3, dynamically setting
    the Content-Disposition based on the file metadata.
    """
    if settings.USE_MINIO:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        )
    else:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )

    # Fetch the object's metadata
    metadata = s3_client.head_object(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key
    )
    # Determine the content type
    content_type = metadata.get("ContentType", "application/octet-stream")

    # Example logic to determine Content-Disposition based on content_type or other criteria
    if content_type.startswith("image/"):
        disposition = "inline"
    else:
        disposition = "attachment"
        # Optionally, use the file's original name from metadata, if available
        file_name = key.split("/")[
            -1
        ]  # Basic way to extract file name
        disposition += f'; filename="{file_name}"'

    try:
        response = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
                "ResponseContentDisposition": disposition,
                "ResponseContentType": content_type,
            },
            ExpiresIn=expiration,
        )

        # Manually replace with
        url = response.replace(settings.AWS_S3_ENDPOINT_URL, f"{scheme}://{host}") if settings.USE_MINIO and response.startswith(settings.AWS_S3_ENDPOINT_URL) else response

        return url
    except Exception as e:
        print(f"Error generating presigned download URL: {e}")
        return None
