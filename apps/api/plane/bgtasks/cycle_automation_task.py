# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Cycle automation tasks. See ``plane.utils.cycle_automation``."""

# Django imports
from django.db import transaction

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Cycle
from plane.utils.cycle_automation import reset_runs_after_date_change, run_due_rules, run_rules_for_cycle
from plane.utils.exception_logger import log_exception


@shared_task
def run_cycle_automation():
    """Every few minutes (beat): fire the rules of cycles that started or completed since the last run."""
    try:
        run_due_rules()
    except Exception as e:
        log_exception(e)


@shared_task
def run_cycle_automation_for_cycle(cycle_id, dates_changed=False):
    """Right after a cycle is created or its dates change (app and REST v1)."""
    try:
        cycle = Cycle.objects.filter(pk=cycle_id).first()
        if cycle is None:
            return
        if dates_changed:
            reset_runs_after_date_change(cycle)
        run_rules_for_cycle(cycle)
    except Exception as e:
        log_exception(e)


def queue_cycle_automation(cycle_id, dates_changed):
    """Called by the cycle views after a create or an edit: runs the cycle's rules once the change is committed."""
    if dates_changed:
        transaction.on_commit(lambda: run_cycle_automation_for_cycle.delay(str(cycle_id), dates_changed=True))
