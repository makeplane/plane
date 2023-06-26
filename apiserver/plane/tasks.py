from celery import shared_task
from plane.db.models import Issue
from datetime import datetime, timedelta, timezone

@shared_task
def archive_old_issues():
    issues = Issue.objects.all()

    for issue in issues:
        issue_updated_at = issue.updated_at.replace(tzinfo=timezone.utc)
        if issue_updated_at < (datetime.now(timezone.utc) - timedelta(days=180)):
            issue.archive_at = datetime.now()
            issue.save()
