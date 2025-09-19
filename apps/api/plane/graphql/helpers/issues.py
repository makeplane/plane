# Third Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Module Imports
from plane.db.models import FileAsset, Issue, IssueLink, IssueRelation
from plane.graphql.types.asset import FileAssetEntityType
from plane.graphql.types.issues.base import IssueStatsType


def get_issue_stats_count(
    workspace_slug: str, project_id: str, issue: str
) -> IssueStatsType:
    sub_work_items_count = Issue.objects.filter(
        workspace__slug=workspace_slug,
        project_id=project_id,
        parent_id=issue,
    ).count()
    attachments_count = FileAsset.objects.filter(
        entity_type=FileAssetEntityType.ISSUE_ATTACHMENT.value,
        issue_id=issue,
    ).count()
    relations_count = IssueRelation.objects.filter(
        Q(issue_id=issue) | Q(related_issue_id=issue)
    ).count()
    links_count = IssueLink.objects.filter(issue_id=issue).count()

    return IssueStatsType(
        attachments=attachments_count,
        relations=relations_count,
        sub_work_items=sub_work_items_count,
        links=links_count,
    )


@sync_to_async
def get_issue_stats_count_async(
    workspace_slug: str, project_id: str, issue: str
) -> IssueStatsType:
    return get_issue_stats_count(
        workspace_slug=workspace_slug, project_id=project_id, issue=issue
    )
