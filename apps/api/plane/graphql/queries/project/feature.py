# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Project
from plane.ee.models import ProjectFeature
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.project import ProjectFeatureType


# workspace issues information query
@strawberry.type
class ProjectFeatureQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def project_features(
        self,
        info: Info,
        slug: str,
        project: str,
    ) -> ProjectFeatureType:
        try:
            user = info.context.user
            user_id = str(user.id)

            project_teamspace_filter = await project_member_filter_via_teamspaces_async(
                user_id=user_id,
                workspace_slug=slug,
                related_field="id",
                query={
                    "project_projectmember__member_id": user_id,
                    "project_projectmember__is_active": True,
                    "archived_at__isnull": True,
                },
            )

            project = await sync_to_async(list)(
                Project.objects.filter(workspace__slug=slug, id=project)
                .filter(project_teamspace_filter.query)
                .distinct()
            )
            if not project:
                raise Project.DoesNotExist

            project_details = project[0] if project and len(project) > 0 else None
            project_details_id = str(project_details.id) if project_details else None
            project_feature = await sync_to_async(ProjectFeature.objects.get)(
                workspace__slug=slug,
                project__id=project_details_id,
            )
        except (ProjectFeature.DoesNotExist, Project.DoesNotExist):
            return ProjectFeatureType(
                # Project
                module_view=False,
                cycle_view=False,
                issue_views_view=False,
                page_view=False,
                intake_view=False,
                guest_view_all_features=False,
                # Project features
                is_project_updates_enabled=False,
                is_epic_enabled=False,
                is_workflow_enabled=False,
            )

        return ProjectFeatureType(
            # Project
            module_view=project_details.module_view,
            cycle_view=project_details.cycle_view,
            issue_views_view=project_details.issue_views_view,
            page_view=project_details.page_view,
            intake_view=project_details.intake_view,
            guest_view_all_features=project_details.guest_view_all_features,
            # Project features
            is_project_updates_enabled=project_feature.is_project_updates_enabled,
            is_epic_enabled=project_feature.is_epic_enabled,
            is_workflow_enabled=project_feature.is_workflow_enabled,
        )
