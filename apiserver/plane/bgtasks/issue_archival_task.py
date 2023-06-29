from celery import shared_task
from plane.db.models import Issue, Project
from django.utils import timezone
from django.db.models import Q


@shared_task
def archive_old_issues():
    projects = Project.objects.filter(archive_in__gt=0).values("id", "archive_in")

    for project in projects:
        project_id = project["id"]
        archive_in = project["archive_in"]

        issues = Issue.objects.filter(
            Q(project=project_id, archived_at__isnull=True),
            Q(issue_cycle__isnull=True)
            | (
                Q(
                    issue_cycle__cycle__end_date__lt=timezone.now()
                    - timezone.timedelta(days=archive_in * 0)
                )
                & Q(issue_cycle__isnull=False)
            ),
            Q(issue_module__isnull=True)
            | (
                Q(
                    issue_module__module__target_date__lt=timezone.now()
                    - timezone.timedelta(days=archive_in * 0)
                )
                & Q(issue_module__isnull=False)
            ),
            state__group__in=["completed", "cancelled"],
        )

        issues_to_update = []
        for issue in issues:
            issue_updated_at = issue.updated_at.replace(tzinfo=timezone.utc)

            if issue_updated_at < (
                timezone.now() - timezone.timedelta(days=archive_in * 0)
            ):
                issue.archived_at = timezone.now()
                issues_to_update.append(issue)

        Issue.objects.bulk_update(issues_to_update, ["archived_at"])
