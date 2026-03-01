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

"""
Recurring Work Item Scheduler

This module implements a batch scheduling approach for recurring work items.
Instead of creating individual PeriodicTasks for each recurring work item,
it uses a single batch scheduler that runs every 15 minutes.

Architecture:
- schedule_batch: Runs every 15 minutes, finds all tasks due in the next 15 minutes
- schedule_on_create_or_enable: Called directly when creating/enabling a task
- _schedule_task: Helper to schedule a single task with unique task_id for idempotency

Migration Strategy:
- Legacy tasks (with periodic_task set) are handled by the old PeriodicTask system
- New tasks (periodic_task IS NULL) are handled by the batch scheduler
- The periodic_task__isnull=True filter prevents double scheduling
"""

from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from django.db.models import Q
import logging

from plane.ee.models import RecurringWorkitemTask
from plane.ee.bgtasks.recurring_work_item_task import create_work_item_from_template

logger = logging.getLogger("plane.worker")

# Scheduler configuration
BATCH_WINDOW_MINUTES = 15


@shared_task
def schedule_batch():
    """
    Main batch scheduler - runs every 15 minutes.
    Finds all recurring tasks due in the next 15 minutes and schedules them.

    IMPORTANT: Only processes tasks where periodic_task IS NULL.
    Legacy tasks (with periodic_task set) are handled by the old PeriodicTask
    system until they execute and get cleaned up.
    """
    now = timezone.now()
    window_end = now + timedelta(minutes=BATCH_WINDOW_MINUTES)

    # Get all enabled, non-expired tasks due within window
    # CRITICAL: periodic_task__isnull=True ensures we don't double-schedule
    # legacy tasks that still have a PeriodicTask
    tasks = (
        RecurringWorkitemTask.objects.filter(
            enabled=True,
            periodic_task__isnull=True,  # Only NEW tasks (legacy handled by old system)
            next_scheduled_at__isnull=False,
            next_scheduled_at__lte=window_end,
        )
        .filter(Q(end_at__isnull=True) | Q(end_at__gt=now))
        .select_related("workitem_blueprint", "project", "workspace")
    )

    scheduled_count = 0

    # Process in chunks to avoid memory issues with large datasets
    for task in tasks.iterator(chunk_size=100):
        try:
            if _schedule_task(task, now):
                scheduled_count += 1
        except Exception as e:
            logger.error(f"Failed to schedule recurring task {task.id}: {e}")

    logger.info(f"Recurring batch scheduler: scheduled {scheduled_count} tasks for next {BATCH_WINDOW_MINUTES}m")
    return {"scheduled": scheduled_count}


@shared_task
def schedule_on_create_or_enable(recurring_workitem_task_id: str):
    """
    Called when a recurring task is created or enabled.
    Schedules immediately if due within 15 minutes.

    Skips if task has a legacy periodic_task (handled by old system).
    """
    try:
        task = RecurringWorkitemTask.objects.get(id=recurring_workitem_task_id)
    except RecurringWorkitemTask.DoesNotExist:
        logger.warning(f"Recurring task {recurring_workitem_task_id} not found")
        return {"status": "not_found"}

    if not task.enabled:
        logger.info(f"Recurring task {recurring_workitem_task_id} is disabled, skipping")
        return {"status": "disabled"}

    # Skip if legacy task with periodic_task (handled by old system)
    if task.periodic_task:
        logger.info(f"Recurring task {recurring_workitem_task_id} handled by legacy PeriodicTask system")
        return {"status": "legacy_task", "message": "Handled by old PeriodicTask system"}

    # Calculate next_scheduled_at if not set
    # allow_past=True enables immediate execution if start date is today
    if not task.next_scheduled_at:
        task.next_scheduled_at = task.calculate_next_scheduled_at(allow_past=True)
        task.save(update_fields=["next_scheduled_at"])

    now = timezone.now()
    window_end = now + timedelta(minutes=BATCH_WINDOW_MINUTES)

    if task.next_scheduled_at and task.next_scheduled_at <= window_end:
        if _schedule_task(task, now):
            logger.info(f"Scheduled recurring task {task.id} for {task.next_scheduled_at}")
            return {"status": "scheduled", "next_scheduled_at": str(task.next_scheduled_at)}
        return {"status": "already_scheduled"}

    logger.info(f"Recurring task {recurring_workitem_task_id} not due yet, next run at {task.next_scheduled_at}")
    return {"status": "not_due_yet", "next_scheduled_at": str(task.next_scheduled_at)}


def _schedule_task(task, now):
    """
    Schedule a single recurring task.

    Uses unique task_id for idempotency - Celery will reject duplicates
    with the same task_id, preventing double execution.

    Args:
        task: RecurringWorkitemTask instance
        now: Current datetime

    Returns:
        bool: True if task was scheduled, False otherwise
    """
    if not task.next_scheduled_at:
        return False

    # Generate unique task ID for idempotency
    # Format: recurring_{task_id}_{timestamp}
    # Celery will reject duplicates with same task_id
    task_id = f"recurring_{task.id}_{int(task.next_scheduled_at.timestamp())}"

    # Always dispatch immediately — the short 15-minute schedule interval means
    # tasks are at most a few minutes early. Avoids long ETA holds that trigger
    # RabbitMQ consumer_timeout redelivery storms.
    logger.info(f"Dispatching recurring task {task.id} (scheduled for {task.next_scheduled_at})")
    create_work_item_from_template.apply_async(
        kwargs={"recurring_workitem_task_id": str(task.id)},
        task_id=task_id,
    )

    return True
