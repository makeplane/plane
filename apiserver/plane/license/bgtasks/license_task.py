# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.license.models import License

@shared_task
def license_check_task():

    license = License.objects.first()
    now = timezone.now()
    if license.check_frequency == "daily" and (now - license.last_checked_at).total_seconds() > 86400:
        pass

    if license.check_frequency == "fortnite" and (now - license.last_checked_at).total_seconds():
        pass