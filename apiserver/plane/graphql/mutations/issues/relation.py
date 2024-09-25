# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.graphql.permissions.project import ProjectBasePermission
from plane.db.models import Workspace, IssueRelation


@strawberry.type
class IssueRelationMutation:
    # adding issue relation
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def addIssueRelation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        relation_type: str,
        related_issue_ids: list[strawberry.ID],
    ) -> bool:
        workspace_details = await sync_to_async(
            Workspace.objects.filter(slug=slug).first
        )()
        if not workspace_details:
            return False

        issue_relations = [
            IssueRelation(
                issue_id=(
                    related_issue_id if relation_type == "blocking" else issue
                ),
                related_issue_id=(
                    issue if relation_type == "blocking" else related_issue_id
                ),
                relation_type=(
                    "blocked_by"
                    if relation_type == "blocking"
                    else relation_type
                ),
                project_id=project,
                workspace_id=workspace_details.id,
                created_by=info.context.user,
                updated_by=info.context.user,
            )
            for related_issue_id in related_issue_ids
        ]

        await sync_to_async(
            lambda: IssueRelation.objects.bulk_create(
                issue_relations,
                batch_size=10,
                ignore_conflicts=True,
            )
        )()

        return True

    # removing issue relation
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def removeIssueRelation(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        relation_type: str,
        related_issue: strawberry.ID,
    ) -> bool:
        issue_relation = await sync_to_async(
            lambda: IssueRelation.objects.get(
                workspace__slug=slug,
                project_id=project,
                issue_id=(
                    related_issue if relation_type == "blocking" else issue
                ),
                related_issue_id=(
                    issue if relation_type == "blocking" else related_issue
                ),
            )
        )()

        if not issue_relation:
            return False

        await sync_to_async(lambda: issue_relation.delete())()

        return True
