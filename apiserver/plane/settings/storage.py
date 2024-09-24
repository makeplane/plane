# Python imports
import os

# Third party imports
import boto3
from botocore.exceptions import ClientError

# Module imports
from plane.utils.exception_logger import log_exception


class S3Storage(object):
    """S3 storage class to generate presigned URLs for S3 objects"""

    def __init__(self):
        # Get the AWS credentials and bucket name from the environment
        self.aws_access_key_id = os.environ.get("AWS_ACCESS_KEY_ID")
        # Use the AWS_SECRET_ACCESS_KEY environment variable for the secret key
        self.aws_secret_access_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
        # Use the AWS_S3_BUCKET_NAME environment variable for the bucket name
        self.aws_storage_bucket_name = os.environ.get("AWS_S3_BUCKET_NAME")
        # Use the AWS_REGION environment variable for the region
        self.aws_region = os.environ.get("AWS_REGION")
        # Use the AWS_S3_ENDPOINT_URL environment variable for the endpoint URL
        self.aws_s3_endpoint_url = os.environ.get(
            "AWS_S3_ENDPOINT_URL"
        ) or os.environ.get("MINIO_ENDPOINT_URL")

        # Create an S3 client
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key,
            region_name=self.aws_region,
            endpoint_url=self.aws_s3_endpoint_url,
            config=boto3.session.Config(signature_version="s3v4"),
        )

    def generate_presigned_post(
        self, object_name, file_type, file_size, expiration=3600
    ):
        """Generate a presigned URL to upload an S3 object"""
        fields = {"Content-Type": file_type}

        conditions = [
            {"bucket": self.aws_storage_bucket_name},
            ["content-length-range", 1, file_size],
            {"Content-Type": file_type},
        ]

        # Add condition for the object name (key)
        if object_name.startswith("${filename}"):
            conditions.append(
                ["starts-with", "$key", object_name[: -len("${filename}")]]
            )
        else:
            fields["key"] = object_name
            conditions.append({"key": object_name})

        # Generate the presigned POST URL
        try:
            # Generate a presigned URL for the S3 object
            response = self.s3_client.generate_presigned_post(
                Bucket=self.aws_storage_bucket_name,
                Key=object_name,
                Fields=fields,
                Conditions=conditions,
                ExpiresIn=expiration,
            )
        # Handle errors
        except ClientError as e:
            print(f"Error generating presigned POST URL: {e}")
            return None

        return response

    def generate_presigned_url(
        self, object_name, expiration=600, http_method="GET"
    ):
        """Generate a presigned URL to share an S3 object"""
        try:
            response = self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.aws_storage_bucket_name,
                    "Key": object_name,
                },
                ExpiresIn=expiration,
                HttpMethod=http_method,
            )
        except ClientError as e:
            log_exception(e)
            return None

        # The response contains the presigned URL
        return response

    def get_object_metadata(self, object_name):
        """Get the metadata for an S3 object"""
        try:
            response = self.s3_client.head_object(
                Bucket=self.aws_storage_bucket_name, Key=object_name
            )
        except ClientError as e:
            log_exception(e)
            return None

        return {
            "ContentType": response.get("ContentType"),
            "ContentLength": response.get("ContentLength"),
            "LastModified": (
                response.get("LastModified").isoformat()
                if response.get("LastModified")
                else None
            ),
            "ETag": response.get("ETag"),
            "Metadata": response.get("Metadata", {}),
        }
