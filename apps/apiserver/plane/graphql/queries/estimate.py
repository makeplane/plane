from asgiref.sync import sync_to_async
from strawberry.permission import PermissionExtension
from plane.db.models import EstimatePoint
from plane.graphql.types.estimate import EstimatePointType
from plane.graphql.permissions.project import ProjectBasePermission
from strawberry.types import Info
import strawberry


@strawberry.type
class EstimatePointQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def estimatePoints(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> list[EstimatePointType]:
        estimate_points = await sync_to_async(list)(
            EstimatePoint.objects.filter(
                workspace__slug=slug, project_id=project
            ).order_by("-created_at")
        )
        return estimate_points
