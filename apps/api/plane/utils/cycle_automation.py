# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Cycle automation: run a project's rules for a cycle that started or completed.

- A cycle has started when ``start_date <= now <= end_date`` and has completed when ``end_date < now``.
- A rule fires at most once per cycle: the ``CycleAutomationRun`` row is created in the same transaction as the move.
- Enabling a rule records baseline runs for the cycles that already meet its trigger, so enabling never moves the
  current or past cycles (the manual "move all" action does that on demand).
- A change of a cycle's dates deletes its runs whose trigger no longer holds, so a reopened cycle can fire again.
- Moves go through ``bulk_update_work_items`` as the workspace's "Cycle automation" bot user, without notifications.
"""

# Python imports
import logging
import uuid
from datetime import timedelta
from urllib.parse import urlparse

# Django imports
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

# Module imports
from plane.db.models import (
    Cycle,
    CycleAutomationRule,
    CycleAutomationRun,
    CycleAutomationTrigger,
    CycleIssue,
    Issue,
    User,
)
from plane.db.models.user import BotTypeEnum
from plane.utils.work_item_bulk_update import MAX_WORK_ITEMS, BulkUpdateError, bulk_update_work_items

logger = logging.getLogger("plane.worker")

BOT_DISPLAY_NAME = "Cycle automation"
# completed cycles older than this are left to the baseline and the date edit path, which keeps the beat query small
COMPLETED_LOOKBACK = timedelta(days=7)


def get_automation_bot(workspace):
    """The workspace's cycle automation bot user, created on first use (like the workspace seed bot)."""
    username = f"bot_user_cycle_automation_{workspace.id}"
    bot = User.objects.filter(username=username).first()
    if bot is not None:
        return bot
    host = urlparse(settings.WEB_URL or "https://plane.so").hostname or "plane.so"
    try:
        with transaction.atomic():
            return User.objects.create(
                username=username,
                display_name=BOT_DISPLAY_NAME,
                first_name=BOT_DISPLAY_NAME,
                last_name="",
                is_bot=True,
                bot_type=BotTypeEnum.CYCLE_AUTOMATION,
                email=f"{username}@{host}",
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )
    except IntegrityError:
        # created concurrently
        return User.objects.get(username=username)


def trigger_met(trigger, cycle, now):
    if cycle.start_date is None or cycle.end_date is None or cycle.archived_at is not None:
        return False
    if trigger == CycleAutomationTrigger.CYCLE_STARTED:
        return cycle.start_date <= now <= cycle.end_date
    if trigger == CycleAutomationTrigger.CYCLE_COMPLETED:
        return cycle.end_date < now
    return False


def record_baseline(rule, now=None):
    """Mark the cycles that already meet ``rule``'s trigger as run, without moving anything."""
    now = now or timezone.now()
    cycles = Cycle.objects.filter(project_id=rule.project_id, archived_at__isnull=True).exclude(
        Q(start_date__isnull=True) | Q(end_date__isnull=True)
    )
    runs = [
        CycleAutomationRun(cycle=cycle, rule=rule, baseline=True)
        for cycle in cycles
        if trigger_met(rule.trigger, cycle, now)
    ]
    CycleAutomationRun.objects.bulk_create(runs, batch_size=200, ignore_conflicts=True)


def reset_runs_after_date_change(cycle, now=None):
    """Delete the runs of ``cycle`` whose trigger no longer holds (its dates changed)."""
    now = now or timezone.now()
    stale = [
        run.pk for run in cycle.automation_runs.select_related("rule") if not trigger_met(run.rule.trigger, cycle, now)
    ]
    if stale:
        CycleAutomationRun.objects.filter(pk__in=stale).delete()


def cycle_work_item_ids(cycle, from_state_ids):
    """Ids of the cycle's work items (not archived, draft or triage) in one of ``from_state_ids``."""
    return [
        str(issue_id)
        for issue_id in CycleIssue.objects.filter(
            cycle_id=cycle.id,
            issue__in=Issue.issue_objects.filter(project_id=cycle.project_id, state_id__in=from_state_ids),
        ).values_list("issue_id", flat=True)
    ]


def run_rules_for_cycle(cycle, now=None):
    """Fire every enabled rule of the cycle's project whose trigger the cycle meets and that has not run for it."""
    now = now or timezone.now()
    rules = CycleAutomationRule.objects.filter(project_id=cycle.project_id, is_enabled=True).select_related(
        "project", "workspace", "to_state"
    )
    bot = None
    for rule in rules:
        if not trigger_met(rule.trigger, cycle, now) or rule.to_state is None:
            continue
        if CycleAutomationRun.objects.filter(cycle_id=cycle.id, rule_id=rule.id).exists():
            continue
        bot = bot or get_automation_bot(rule.workspace)
        try:
            with transaction.atomic():
                run, created = CycleAutomationRun.objects.get_or_create(cycle_id=cycle.id, rule_id=rule.id)
                if not created:
                    continue
                ids = cycle_work_item_ids(cycle, rule.from_state_ids)
                moved = 0
                for start in range(0, len(ids), MAX_WORK_ITEMS):
                    result = bulk_update_work_items(
                        rule.project,
                        ids[start : start + MAX_WORK_ITEMS],
                        {"state": str(rule.to_state_id)},
                        actor_id=bot.id,
                        notification=False,
                    )
                    moved += len(result["updated"])
                run.moved_count = moved
                run.save(update_fields=["moved_count", "updated_at"])
        except (BulkUpdateError, IntegrityError) as e:
            logger.warning("cycle automation rule %s skipped for cycle %s: %s", rule.id, cycle.id, e.__class__.__name__)


def run_due_rules(now=None):
    """Beat entry: every project with enabled rules, for its current and recently completed cycles."""
    now = now or timezone.now()
    project_ids = CycleAutomationRule.objects.filter(is_enabled=True).values_list("project_id", flat=True).distinct()
    cycles = Cycle.objects.filter(
        project_id__in=project_ids,
        archived_at__isnull=True,
        project__archived_at__isnull=True,
        start_date__lte=now,
        end_date__gte=now - COMPLETED_LOOKBACK,
    )
    for cycle in cycles:
        run_rules_for_cycle(cycle, now)
