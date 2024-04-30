# Python imports
import boto3
import json
from botocore.exceptions import ClientError

# Django imports
from django.core.management import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Create the default bucket for the instance"

    def set_bucket_public_policy(self, s3_client, bucket_name):
        public_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                }
            ],
        }

        try:
            s3_client.put_bucket_policy(
                Bucket=bucket_name, Policy=json.dumps(public_policy)
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Public read access policy set for bucket '{bucket_name}'."
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
            session = boto3.session.Session(
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            # Create an S3 client using the session
            s3_client = session.client(
                "s3", endpoint_url=settings.AWS_S3_ENDPOINT_URL
            )
            bucket_name = settings.AWS_STORAGE_BUCKET_NAME

            self.stdout.write(self.style.NOTICE("Checking bucket..."))

            # Check if the bucket exists
            s3_client.head_bucket(Bucket=bucket_name)

            self.set_bucket_public_policy(s3_client, bucket_name)
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
                    self.set_bucket_public_policy(s3_client, bucket_name)
                except ClientError as create_error:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Failed to create bucket: {create_error}"
                        )
                    )
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
