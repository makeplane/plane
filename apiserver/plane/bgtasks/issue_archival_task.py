from celery import shared_task
from plane.db.models import Issue
from django.utils import timezone

@shared_task
def archive_old_issues():
    issues = Issue.objects.all()

    for issue in issues:
        issue_updated_at = issue.updated_at.replace(tzinfo=timezone.utc)
        if issue_updated_at < (timezone.now() - timezone.timedelta(days=180)):
            issue.archived_at = timezone.now()
            issue.save()

