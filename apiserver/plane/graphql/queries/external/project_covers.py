# Third-Party Imports
import strawberry

# Python Standard Library Imports

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.external import ProjectCovers


@strawberry.type
class ProjectCoversQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def project_covers(self, slug: str, info: Info) -> ProjectCovers:
        project_cover_files = [
            "https://cover-images.plane.so/project-covers/f2ea49f1-1a23-46c3-99e4-1f6185bff8fc.webp",
            "https://cover-images.plane.so/project-covers/0fec1f5e-3a54-4260-beb1-25eb5de8fd87.webp",
            "https://cover-images.plane.so/project-covers/05a7e2d0-c846-44df-abc2-99e14043dfb9.webp",
            "https://cover-images.plane.so/project-covers/8c561535-6be5-4fb8-8ec1-0cba19507938.webp",
            "https://cover-images.plane.so/project-covers/11cde8b7-f051-4a9d-a35e-45b475d757a2.webp",
            "https://cover-images.plane.so/project-covers/27b12e3a-5e24-4ea9-b5ac-32caaf81a1c3.webp",
            "https://cover-images.plane.so/project-covers/32d808af-650a-4228-9386-253d1a7c2a13.webp",
            "https://cover-images.plane.so/project-covers/71dbaf8f-fd3c-4f9a-b342-309cf4f22741.webp",
            "https://cover-images.plane.so/project-covers/322a58cb-e019-4477-b3eb-e2679d4a2b47.webp",
            "https://cover-images.plane.so/project-covers/061042d0-cf7b-42eb-8fb5-e967b07e9e57.webp",
            "https://cover-images.plane.so/project-covers/683b5357-b5f1-42c7-9a87-e7ff6be0eea1.webp",
            "https://cover-images.plane.so/project-covers/51495ec3-266f-41e8-9360-589903fd4f56.webp",
            "https://cover-images.plane.so/project-covers/1031078f-28d7-496f-b92b-dec3ea83519d.webp",
            "https://cover-images.plane.so/project-covers/a65e3aed-4a88-4ecf-a9f7-b74d0e4a1f03.webp",
            "https://cover-images.plane.so/project-covers/ab31a6ba-51e2-44ad-a00d-e431b4cf865f.webp",
            "https://cover-images.plane.so/project-covers/adb8a78f-da02-4b68-82ca-fa34ce40768b.webp",
            "https://cover-images.plane.so/project-covers/c29d7097-12dc-4ae0-a785-582e2ceadc29.webp",
            "https://cover-images.plane.so/project-covers/d7a7e86d-fe5b-4256-8625-d1c6a39cdde9.webp",
            "https://cover-images.plane.so/project-covers/d27444ac-b76e-4c8f-b272-6a6b00865869.webp",
            "https://cover-images.plane.so/project-covers/e7fb2595-987e-4f0c-b251-62d071f501fa.webp",
        ]
        return ProjectCovers(urls=project_cover_files)
