# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Standard Library imports
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

# Third Party imports
from celery import shared_task
from django.db import transaction
from django.utils import timezone

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

    try:
        event_id = event_data.get("event_id")
        event_type = event_data.get("event_type")

        # Get the workspace slug
        workspace_id = event_data.get("workspace_id")
        logger.info(f"Executing automation task for event in Workspace : {workspace_id}")
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

        with transaction.atomic():
            # Mark event as processing
            # TODO: Do we need this logic? (might be required when we have multiple consumers running)
            updated_count = ProcessedAutomationEvent.mark_processing(event_id=event_id, task_id=self.request.id)

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
                logger.info(f"Event {event_id} triggered {len(automation_results)} automations")

                # Mark as completed
                ProcessedAutomationEvent.mark_completed(event_id)

                return {
                    "success": True,
                    "event_id": event_id,
                    "automations_triggered": len(automation_results),
                    "automation_runs": [result.get("automation_run_id") for result in automation_results],
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
    except Workspace.DoesNotExist:
        logger.warning(f"Workspace {workspace_id} does not exist")
        return {
            "success": False,
            "event_id": event_id,
            "automations_triggered": 0,
            "error": f"Workspace {workspace_id} does not exist",
        }
    except Exception as e:
        logger.error(f"Error processing automation for event {event_id}: {e}")
        log_exception(e)

        # Mark as failed
        try:
            ProcessedAutomationEvent.mark_failed(event_id=event_id, error_message=str(e), increment_retry=True)
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


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 60},
    retry_backoff=True,
    retry_jitter=True,
)
def execute_scheduled_automation(
    self, automation_id: str, trigger_node_id: str, scheduled_at_iso: str
) -> Dict[str, Any]:
    """
    Execute a scheduled automation. Called by the batch scheduler when a
    trigger's next_scheduled_at is due. Builds a synthetic event and runs
    the automation through the existing engine.
    """
    import uuid as uuid_mod

    from django.db import connection
    from django.db.models import F

    from plane.automations.engine import automation_engine, NodeResult
    from plane.ee.models import (
        Automation,
        AutomationActivity,
        AutomationNode,
        AutomationRun,
        AutomationScopeChoices,
        AutomationStatusChoices,
        RunStatusChoices,
    )

    try:
        automation = Automation.objects.select_related("current_version", "workspace", "project").get(id=automation_id)

        if not automation.is_enabled or automation.status != AutomationStatusChoices.PUBLISHED:
            logger.info(f"Scheduled automation {automation_id} is not active, skipping")
            return {"success": False, "error": "Automation not active"}

        is_enabled = check_workspace_feature_flag(
            feature_key=FeatureFlag.PROJECT_AUTOMATIONS,
            slug=automation.workspace.slug,
        )
        if not is_enabled:
            logger.info(f"Automations not enabled for workspace {automation.workspace.slug}")
            return {"success": False, "error": "Feature not enabled"}

        version = automation.current_version
        if not version:
            return {"success": False, "error": "No published version"}

        nodes = automation_engine._load_automation_nodes(version)

        scheduled_at = datetime.fromisoformat(scheduled_at_iso)
        synthetic_event = {
            "event_type": "automation.scheduled",
            "event_id": str(uuid_mod.uuid4()),
            "timestamp": int(scheduled_at.timestamp()),
            "workspace_id": str(automation.workspace_id),
            "project_id": str(automation.project_id),
            "entity_type": automation.scope or AutomationScopeChoices.WORKITEM,
            "payload": {
                "scheduled_at": scheduled_at_iso,
            },
        }

        trigger_result = NodeResult(
            success=True,
            output={"scheduled_at": scheduled_at_iso},
        )

        with transaction.atomic():
            try:
                with connection.cursor() as cur:
                    cur.execute("SELECT set_config('plane.initiator_type', 'SYSTEM.AUTOMATION', true)")
            except Exception:
                pass

            automation_run = AutomationRun.objects.create(
                automation=automation,
                version=version,
                workspace_id=automation.workspace_id,
                project_id=automation.project_id,
                trigger_event=synthetic_event,
                trigger_source="schedule",
                status=RunStatusChoices.RUNNING,
                started_at=timezone.now(),
                entity_type=automation.scope or AutomationScopeChoices.WORKITEM,
            )

            Automation.objects.filter(id=automation.id).update(
                run_count=F("run_count") + 1,
                last_run_at=timezone.now(),
            )

            try:
                AutomationActivity.objects.create(
                    automation=automation,
                    automation_version=version,
                    automation_run=automation_run,
                    actor=getattr(automation, "bot_user", None),
                    verb="created",
                    field="automation.run_history",
                    new_value=str(automation_run.id),
                    project_id=automation.project_id,
                    workspace_id=automation.workspace_id,
                )
            except Exception:
                logger.warning("Failed to create AutomationActivity for scheduled run", exc_info=True)

            result = automation_engine._execute_automation_after_trigger(
                automation_run, synthetic_event, trigger_result, nodes
            )

            AutomationNode.objects.filter(id=trigger_node_id).update(last_triggered_at=timezone.now())

            return result.to_dict()

    except Automation.DoesNotExist:
        logger.warning(f"Automation {automation_id} not found")
        return {"success": False, "error": f"Automation {automation_id} not found"}
    except Exception as e:
        logger.error(f"Error executing scheduled automation {automation_id}: {e}")
        log_exception(e)
        raise


@shared_task
def schedule_automation_triggers_batch() -> Dict[str, Any]:
    """
    Batch scheduler for scheduled automation triggers.
    Runs every 5 minutes via Celery Beat. Finds due triggers and dispatches execution.
    """
    from django.db.models import F

    from plane.ee.models import AutomationNode, AutomationStatusChoices

    window_end = timezone.now() + timedelta(minutes=5)
    dispatched = 0
    errors = 0

    try:
        with transaction.atomic():
            due_triggers = (
                AutomationNode.objects.select_for_update(skip_locked=True)
                .filter(
                    handler_name="scheduled",
                    is_enabled=True,
                    next_scheduled_at__isnull=False,
                    next_scheduled_at__lte=window_end,
                    version__automation__is_enabled=True,
                    version__automation__status=AutomationStatusChoices.PUBLISHED,
                    version__automation__current_version_id=F("version_id"),
                    version__automation__deleted_at__isnull=True,
                )
                .select_related("version__automation__project")
            )

            for trigger_node in due_triggers:
                try:
                    automation = trigger_node.version.automation
                    scheduled_at = trigger_node.next_scheduled_at

                    trigger_node.next_scheduled_at = AutomationNode.compute_next_scheduled_at(
                        config=trigger_node.config,
                        project=automation.project,
                        current=scheduled_at,
                    )
                    trigger_node.save(update_fields=["next_scheduled_at"])

                    execute_scheduled_automation.apply_async(
                        args=[str(automation.id), str(trigger_node.id), scheduled_at.isoformat()],
                        task_id=f"scheduled_{trigger_node.id}_{int(scheduled_at.timestamp())}",
                    )
                    dispatched += 1

                except Exception as e:
                    errors += 1
                    logger.error(f"Failed to dispatch trigger {trigger_node.id}: {e}")
                    log_exception(e)

        logger.info(f"Batch scheduler: dispatched={dispatched}, errors={errors}")
        return {"dispatched": dispatched, "errors": errors}

    except Exception as e:
        logger.error(f"Batch scheduler failed: {e}")
        log_exception(e)
        return {"dispatched": 0, "errors": 1, "error": str(e)}
