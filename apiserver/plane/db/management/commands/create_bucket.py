# Python imports
import os
import boto3
import json
from botocore.exceptions import ClientError

# Django imports
from django.core.management import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Create the default bucket for the instance"

    def set_bucket_public_policy(self, s3_client, bucket_name):
        response = s3_client.list_objects_v2(Bucket=bucket_name)
        public_object_resource = []
        if "Contents" in response:
            for obj in response["Contents"]:
                object_key = obj["Key"]
                public_object_resource.append(
                    f"arn:aws:s3:::{bucket_name}/{object_key}"
                )

        # Define the bucket policy to allow access to only existing objects
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": public_object_resource,
                }
            ],
        }

        try:
            s3_client.put_bucket_policy(
                Bucket=bucket_name, Policy=json.dumps(bucket_policy)
            )
            self.stdout.write(
                self.style.SUCCESS(
                    "Bucket is private, but existing objects remain public."
                )
            )
        except ClientError as e:
            self.stdout.write(
                self.style.ERROR(
                    f"Error setting public read access policy: {e}"
                )
            )

    def handle(self, *args, **options):
        # Create a session using the credentials from Django settings
        try:
            s3_client = boto3.client(
                "s3",
                endpoint_url=os.environ.get(
                    "AWS_S3_ENDPOINT_URL"
                ),  # MinIO endpoint
                aws_access_key_id=os.environ.get(
                    "AWS_ACCESS_KEY_ID"
                ),  # MinIO access key
                aws_secret_access_key=os.environ.get(
                    "AWS_SECRET_ACCESS_KEY"
                ),  # MinIO secret key
                region_name=os.environ.get("AWS_REGION"),  # MinIO region
                config=boto3.session.Config(signature_version="s3v4"),
            )
            # Get the bucket name from the environment
            bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
            self.stdout.write(self.style.NOTICE("Checking bucket..."))
            # Check if the bucket exists
            s3_client.head_bucket(Bucket=bucket_name)
            if os.environ.get("USE_MINIO") == "1":
                # If using the existing minio bucket, update the policies
                self.set_bucket_public_policy(s3_client, bucket_name)
            # If the bucket exists, print a success message
            self.stdout.write(
                self.style.SUCCESS(f"Bucket '{bucket_name}' exists.")
            )
            return
        except ClientError as e:
            error_code = int(e.response["Error"]["Code"])
            bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            if error_code == 404:
                # Bucket does not exist, create it
                self.stdout.write(
                    self.style.WARNING(
                        f"Bucket '{bucket_name}' does not exist. Creating bucket..."
                    )
                )
                try:
                    s3_client.create_bucket(Bucket=bucket_name)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Bucket '{bucket_name}' created successfully."
                        )
                    )

                # Handle the exception if the bucket creation fails
                except ClientError as create_error:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Failed to create bucket: {create_error}"
                        )
                    )

            # Handle the exception if access to the bucket is forbidden
            elif error_code == 403:
                # Access to the bucket is forbidden
                self.stdout.write(
                    self.style.ERROR(
                        f"Access to the bucket '{bucket_name}' is forbidden. Check permissions."
                    )
                )
            else:
                # Another ClientError occurred
                self.stdout.write(
                    self.style.ERROR(f"Failed to check bucket: {e}")
                )
        except Exception as ex:
            # Handle any other exception
            self.stdout.write(self.style.ERROR(f"An error occurred: {ex}"))
