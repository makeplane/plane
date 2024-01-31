# Third party imports
from storages.backends.s3boto3 import S3Boto3Storage

# Module imports
from plane.utils.presigned_url_generator import generate_download_presigned_url


class S3PrivateBucketStorage(S3Boto3Storage):

    def url(self, name):
        # Return an empty string or None, or implement custom logic here
        return name

    def download_url(self, name):
        return generate_download_presigned_url(name)
