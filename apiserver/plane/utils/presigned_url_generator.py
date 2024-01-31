import boto3
from django.conf import settings

def generate_download_presigned_url(object_name, expiration=3600):
    """
    Generate a presigned URL to download an object from S3.
    :param object_name: The key name of the object in the S3 bucket.
    :param expiration: Time in seconds for the presigned URL to remain valid (default is 1 hour).
    :return: Presigned URL as a string. If error, returns None.
    """
    s3_client = boto3.client('s3',
                             aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                             aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                             region_name=settings.AWS_REGION,
                             endpoint_url=settings.AWS_S3_ENDPOINT_URL)
    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                                                            'Key': object_name},
                                                    ExpiresIn=expiration)
        return response
    except Exception as e:
        print(f"Error generating presigned download URL: {e}")
        return None
