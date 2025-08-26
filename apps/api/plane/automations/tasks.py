# Standard Library imports
import logging
import json
from typing import Dict, Any

# Third Party imports
from celery import shared_task
from django.db import transaction

# Module imports
from plane.db.models import Workspace
from plane.ee.models import ProcessedAutomationEvent
from plane.automations.engine import dispatch_automation_event
from plane.utils.exception_logger import log_exception
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag

# Set up logger
logger = logging.getLogger("plane.automations.tasks")


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 60},
    retry_backoff=True,
    retry_jitter=True,
)
def execute_automation_task(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Celery task to execute automation processing for an event.

    This task integrates the consumer with the existing automation engine,
    providing retry logic with exponential backoff and proper error handling.

    Args:
        event_data: Event data from the outbox/consumer

    Returns:
        Dict containing execution results and status
    """
    event_id = event_data.get("event_id")
    event_type = event_data.get("event_type")

    # Get the workspace slug
    workspace_id = event_data.get("workspace_id")

    workspace = Workspace.objects.get(id=workspace_id)

    # Check if the automation quota is exceeded
    is_automation_enabled = check_workspace_feature_flag(
        feature_key=FeatureFlag.PROJECT_AUTOMATIONS,
        slug=workspace.slug,
    )

    if not is_automation_enabled:
        logger.info(f"Automation is not enabled for workspace {workspace.slug}")
        return {
            "success": True,
        }

    logger.info(f"Starting automation task for event {event_id} ({event_type})")

    try:
        with transaction.atomic():
            # Mark event as processing
            # TODO: Do we need this logic? (might be required when we have multiple consumers running)
            updated_count = ProcessedAutomationEvent.mark_processing(
                event_id=event_id, task_id=self.request.id
            )

            if updated_count == 0:
                # Event might have been processed by another task or doesn't exist
                logger.warning(f"Could not mark event {event_id} as processing")
                return {
                    "success": False,
                    "event_id": event_id,
                    "error": "Event not found or already processed",
                }

            # Dispatch to automation engine
            logger.info(f"Dispatching event {event_id} to automation engine")

            # Call the existing automation engine
            automation_results = dispatch_automation_event(event_data)

            # Check if any automations were triggered
            if automation_results and len(automation_results) > 0:
                logger.info(
                    f"Event {event_id} triggered {len(automation_results)} automations"
                )

                # Mark as completed
                ProcessedAutomationEvent.mark_completed(event_id)

                return {
                    "success": True,
                    "event_id": event_id,
                    "automations_triggered": len(automation_results),
                    "automation_runs": [
                        result.get("automation_run_id") for result in automation_results
                    ],
                }
            else:
                # No automations triggered, but still successful
                logger.info(f"Event {event_id} did not trigger any automations")

                ProcessedAutomationEvent.mark_completed(event_id)

                return {
                    "success": True,
                    "event_id": event_id,
                    "automations_triggered": 0,
                    "message": "No automations triggered for this event",
                }

    except Exception as e:
        logger.error(f"Error processing automation for event {event_id}: {e}")
        log_exception(e)

        # Mark as failed
        try:
            ProcessedAutomationEvent.mark_failed(
                event_id=event_id, error_message=str(e), increment_retry=True
            )
        except Exception as mark_error:
            logger.error(f"Failed to mark event {event_id} as failed: {mark_error}")

        # Re-raise to trigger Celery retry
        raise


@shared_task
def cleanup_processed_events(retention_days: int = 7) -> Dict[str, Any]:
    """
    Cleanup task to remove old processed events to prevent database bloat.

    Args:
        retention_days: Number of days to retain completed/failed events

    Returns:
        Dict containing cleanup statistics
    """
    from django.utils import timezone
    from datetime import timedelta

    cutoff_date = timezone.now() - timedelta(days=retention_days)

    logger.info(f"Starting cleanup of processed events older than {cutoff_date}")

    try:
        # Only delete completed or failed events (keep pending/processing for debugging)
        deleted_count = ProcessedAutomationEvent.objects.filter(
            status__in=["completed", "failed"], completed_at__lt=cutoff_date
        ).delete()[0]

        logger.info(f"Cleaned up {deleted_count} processed events")

        return {
            "success": True,
            "deleted_count": deleted_count,
            "retention_days": retention_days,
        }

    except Exception as e:
        logger.error(f"Error during processed events cleanup: {e}")
        log_exception(e)

        return {
            "success": False,
            "error": str(e),
        }
