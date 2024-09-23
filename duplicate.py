import boto3
from botocore.exceptions import ClientError
import os


def duplicate_bucket(s3_client, source_bucket):
    # Create a new bucket name
    target_bucket = f"{source_bucket}-copy"

    try:
        # Check if source bucket exists
        s3_client.head_bucket(Bucket=source_bucket)

        # Create the new bucket
        s3_client.create_bucket(Bucket=target_bucket)
        print(f"Created new bucket: {target_bucket}")

        # List all objects in the source bucket
        paginator = s3_client.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=source_bucket)

        # Copy each object to the new bucket
        for page in pages:
            if "Contents" in page:
                for obj in page["Contents"]:
                    copy_source = {"Bucket": source_bucket, "Key": obj["Key"]}
                    s3_client.copy_object(
                        CopySource=copy_source, Bucket=target_bucket, Key=obj["Key"]
                    )
                    print(f"Copied object: {obj['Key']}")

        print(f"Successfully duplicated bucket '{source_bucket}' to '{target_bucket}'")

    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchBucket":
            print(f"Error: Source bucket '{source_bucket}' does not exist.")
        else:
            print(f"An error occurred: {e}")


def main():
    # MinIO server configuration
    endpoint_url = os.environ.get("AWS_S3_ENDPOINT_URL")
    access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")

    # Create boto3 client
    s3_client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=boto3.session.Config(signature_version="s3v4"),
    )

    # Specify the source bucket name
    source_bucket = os.environ.get("AWS_S3_BUCKET_NAME")

    # Call the function to duplicate the bucket
    duplicate_bucket(s3_client, source_bucket)


if __name__ == "__main__":
    main()
