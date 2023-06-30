from celery import shared_task

# Django imports
from django.utils import timezone
from django.db.models import Q

# Module imports
from plane.db.models import Issue, Project, IssueActivity


@shared_task
def archive_old_issues():
    projects = Project.objects.filter(archive_in__gt=0)

    for project in projects:
        project_id = project.id
        archive_in = project.archive_in

        issues = Issue.objects.filter(
            Q(project=project_id, archived_at__isnull=True),
            Q(issue_cycle__isnull=True)
            | (
                Q(
                    issue_cycle__cycle__end_date__lt=timezone.now()
                    - timezone.timedelta(days=archive_in * 30)
                )
                & Q(issue_cycle__isnull=False)
            ),
            Q(issue_module__isnull=True)
            | (
                Q(
                    issue_module__module__target_date__lt=timezone.now()
                    - timezone.timedelta(days=archive_in * 30)
                )
                & Q(issue_module__isnull=False)
            ),
            state__group__in=["completed", "cancelled"],
        )

        issues_to_update = []
        for issue in issues:
            issue_updated_at = issue.updated_at.replace(tzinfo=timezone.utc)

            if issue_updated_at < (
                timezone.now() - timezone.timedelta(days=archive_in * 30)
            ):
                issue.archived_at = timezone.now()
                issues_to_update.append(issue)

    if issues_to_update:
        Issue.objects.bulk_update(issues_to_update, ["archived_at"])
        updated_issues = []
        for issue in issues_to_update:
            updated_issues.append(
                IssueActivity(
                    issue_id=issue.id,
                    actor=project.created_by,
                    verb="updated",
                    old_value="",
                    new_value="",
                    field="archived_at",
                    project=project,
                    workspace=project.workspace,
                    comment="Plane has archived this issue",
                )
            )
        IssueActivity.objects.bulk_create(updated_issues)
