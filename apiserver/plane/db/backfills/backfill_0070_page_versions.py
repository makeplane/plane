# Third party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import PageVersion, IssueType, Issue


@shared_task
def backfill_issue_type_task(projects):
    # Create the issue types for all projects
    IssueType.objects.bulk_create(
        [
            IssueType(
                name="Task",
                description="A task that needs to be completed.",
                project_id=project["id"],
                workspace_id=project["workspace_id"],
            )
            for project in projects
        ],
        batch_size=1000,
    )

    # Update the issue type for all existing issues
    issue_types = {
        str(issue_type["project_id"]): str(issue_type["id"])
        for issue_type in IssueType.objects.filter(
            project_id__in=[project["id"] for project in projects]
        ).values("id", "project_id")
    }
    # Update the issue type for all existing issues
    bulk_issues = []
    for issue in Issue.objects.filter(
        project_id__in=[project["id"] for project in projects]
    ):
        issue.type_id = issue_types[str(issue.project_id)]
        bulk_issues.append(issue)

    # Update the issue type for all existing issues
    Issue.objects.bulk_update(bulk_issues, ["type_id"], batch_size=1000)


@shared_task
def backfill_page_versions_task(pages):
    # Create the page versions for all pages
    PageVersion.objects.bulk_create(
        [
            PageVersion(
                page_id=page["id"],
                workspace_id=page["workspace_id"],
                last_saved_at=timezone.now(),
                owned_by_id=page["owned_by_id"],
                description_binary=page["description_binary"],
                description_html=page["description_html"],
                description_stripped=page["description_stripped"],
            )
            for page in pages
        ],
        batch_size=1000,
    )
