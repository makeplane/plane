# Third party imports
from storages.backends.s3boto3 import S3Boto3Storage


class S3PrivateBucketStorage(S3Boto3Storage):

    def url(self, name):
        # Return an empty string or None, or implement custom logic here
        return name
