import os, sys
import boto3
from botocore.exceptions import ClientError


sys.path.append("/code")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")
import django

django.setup()

def create_bucket():
    try:
        from django.conf import settings
        
        # Create a session using the credentials from Django settings
        session = boto3.session.Session(
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        # Create an S3 client using the session
        s3_client = session.client('s3', endpoint_url=settings.AWS_S3_ENDPOINT_URL)
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        
        print("Checking bucket...")
        
        # Check if the bucket exists
        s3_client.head_bucket(Bucket=bucket_name)
        
        # If head_bucket does not raise an exception, the bucket exists
        print(f"Bucket '{bucket_name}' already exists.")
        
    except ClientError as e:
        error_code = int(e.response['Error']['Code'])
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        if error_code == 404:
            # Bucket does not exist, create it
            print(f"Bucket '{bucket_name}' does not exist. Creating bucket...")
            try:
                s3_client.create_bucket(Bucket=bucket_name)
                print(f"Bucket '{bucket_name}' created successfully.")
            except ClientError as create_error:
                print(f"Failed to create bucket: {create_error}")
        elif error_code == 403:
            # Access to the bucket is forbidden
            print(f"Access to the bucket '{bucket_name}' is forbidden. Check permissions.")
        else:
            # Another ClientError occurred
            print(f"Failed to check bucket: {e}")
    except Exception as ex:
        # Handle any other exception
        print(f"An error occurred: {ex}")

if __name__ == "__main__":
    create_bucket()
