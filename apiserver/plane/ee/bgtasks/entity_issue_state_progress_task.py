from celery import shared_task
from plane.ee.models import EntityProgress
from plane.utils.exception_logger import log_exception
from plane.ee.utils.entity_state_progress import calculate_entity_issue_state_progress


@shared_task
def track_entity_issue_state_progress(current_date=None, cycles=[]):
    try:
        analytics_records = calculate_entity_issue_state_progress(current_date, cycles)
        if analytics_records:
            EntityProgress.objects.bulk_create(analytics_records)
    except Exception as e:
        log_exception(e)
