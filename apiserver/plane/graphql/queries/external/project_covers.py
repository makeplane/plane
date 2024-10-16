# Third-Party Imports
import strawberry

# Python Standard Library Imports
import boto3
from django.conf import settings

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.external import ProjectCovers


@strawberry.type
class ProjectCoversQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def project_covers(
        self,
        slug: str,
        info: Info,
    ) -> ProjectCovers:
        project_cover_files = []

        if settings.USE_MINIO:
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
        else:
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
        params = {
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Prefix": "static/project-cover/",
        }

        response = s3.list_objects_v2(**params)
        if "Contents" in response:
            for content in response["Contents"]:
                if not content["Key"].endswith("/"):
                    project_cover_files.append(
                        f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{content['Key']}"
                    )

        return ProjectCovers(urls=project_cover_files)
