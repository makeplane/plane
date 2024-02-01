# Python imports
import uuid
import requests

# Django imports
from django.conf import settings
from django.http import StreamingHttpResponse
# Third party imports
import boto3


def get_file_streams(key, filename=uuid.uuid4().hex):

    if settings.USE_MINIO:
        s3 = boto3.client(
            's3',
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=boto3.session.Config(signature_version='s3v4'),
        )
    else:
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=boto3.session.Config(signature_version='s3v4'),
        )

    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
            'Key': key,
        },
        ExpiresIn=3600,
    )

    # Fetch the object metadata to get the content type
    metadata = s3.head_object(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
    )


    # Stream the file from the custom endpoint URL
    def stream_file_from_url(url):
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:  # filter out keep-alive new chunks
                    yield chunk


    content_type = metadata['ContentType']
    response = StreamingHttpResponse(stream_file_from_url(presigned_url), content_type=content_type)
    response['Content-Disposition'] = f'inline; filename={filename}'  # Adjust filename as needed

    return response
