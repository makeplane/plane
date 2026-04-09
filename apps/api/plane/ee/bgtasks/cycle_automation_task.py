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

import pytz
import re

# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone

# Third Party imports
from celery import shared_task
from django.db.models import Q

# Module imports
from plane.ee.models import CycleSettings, ProjectFeature, AutomatedCycleLog
from plane.db.models import Cycle, Workspace, Project, BotTypeEnum, ProjectMember
from django.db.models import Subquery
from plane.utils.exception_logger import log_exception
from plane.utils.cycle_transfer_issues import transfer_cycle_issues
from plane.utils.timezone_converter import convert_to_utc
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


def _build_cycle_name(base_title: str, sequence: int) -> str:
    normalized_title = base_title.strip()
    return f"{normalized_title} {sequence}"


def _get_next_cycle_sequence(base_title: str, project_id: str, bot_id: str) -> int:
    normalized_title = base_title.strip()
    if not normalized_title:
        return 1

    name_pattern = re.compile(rf"^{re.escape(normalized_title)}\s+(\d+)$")

    bot_cycles = Cycle.all_objects.filter(project_id=project_id).filter(Q(owned_by_id=bot_id) | Q(created_by_id=bot_id))

    last_bot_cycle = bot_cycles.order_by("-created_at").first()
    if not last_bot_cycle:
        return 1

    match = name_pattern.match((last_bot_cycle.name or "").strip())
    if match:
        return int(match.group(1)) + 1

    max_suffix = 0
    for name in bot_cycles.values_list("name", flat=True):
        m = name_pattern.match((name or "").strip())
        if m:
            max_suffix = max(max_suffix, int(m.group(1)))

    return max_suffix + 1 if max_suffix > 0 else 1


def _create_missing_future_cycles(scheduled_cycle: CycleSettings, bot_id, now):
    """
    Create however many future bot cycles are needed to bring the count up to
    scheduled_cycle.number_of_cycles.  Anchors from the last upcoming cycle's
    end_date so new cycles never overlap with existing ones.
    """
    project_id = scheduled_cycle.project_id
    workspace_id = scheduled_cycle.workspace_id
    number_of_cycles = scheduled_cycle.number_of_cycles
    cycle_duration = scheduled_cycle.cycle_duration
    cooldown_period = scheduled_cycle.cooldown_period

    upcoming_cycles = Cycle.objects.filter(
        project_id=project_id,
        start_date__gt=now,
        deleted_at__isnull=True,
    )

    number_of_cycles_diff = number_of_cycles - upcoming_cycles.count()
    if number_of_cycles_diff <= 0:
        return

    # Anchor: end of the last upcoming cycle (any owner, to avoid overlap)
    last_cycle = upcoming_cycles.filter(end_date__isnull=False).order_by("-end_date").first()
    if last_cycle:
        last_cycle_end_date = last_cycle.end_date + timedelta(days=cooldown_period)
    else:
        last_upcoming = upcoming_cycles.filter(start_date__isnull=False).order_by("-start_date").first()
        last_cycle_end_date = (
            last_upcoming.start_date + timedelta(days=cooldown_period)
            if last_upcoming
            else scheduled_cycle.start_date - timedelta(days=1)
        )

    base_title = scheduled_cycle.title.strip()
    next_sequence = _get_next_cycle_sequence(base_title, project_id, bot_id)

    cycles_to_create = []
    for i in range(number_of_cycles_diff):
        start_dt = last_cycle_end_date + timedelta(days=i * (cycle_duration + cooldown_period) + 1)
        end_dt = start_dt + timedelta(days=cycle_duration - 1)

        start_date_utc = convert_to_utc(
            date=str(start_dt.date()),
            project_id=project_id,
            is_start_date=True,
        )
        end_date_utc = convert_to_utc(
            date=str(end_dt.date()),
            project_id=project_id,
        )

        cycles_to_create.append(
            Cycle(
                project_id=project_id,
                workspace_id=workspace_id,
                owned_by_id=bot_id,
                created_by_id=bot_id,
                updated_by_id=bot_id,
                name=_build_cycle_name(base_title, next_sequence),
                start_date=start_date_utc,
                end_date=end_date_utc,
            )
        )
        next_sequence += 1

    created_cycles = Cycle.objects.bulk_create(cycles_to_create, batch_size=50, ignore_conflicts=True)

    if created_cycles:
        AutomatedCycleLog.objects.bulk_create(
            [
                AutomatedCycleLog(
                    automated_cycle=scheduled_cycle,
                    cycle=cycle,
                    workspace_id=workspace_id,
                    project_id=project_id,
                    action="cycle_created",
                    status="success",
                    message=f"Cycle created successfully for {cycle.start_date.date()} - {cycle.end_date.date()}",
                    scheduled_at=now,
                )
                for cycle in created_cycles
            ],
            batch_size=50,
        )


@shared_task
def backfill_automated_cycles(automated_cycle_id: str, project_id: str):
    """
    Backfill upcoming bot-created cycles after a CycleSettings change.
    Delegates to _create_missing_future_cycles so logic stays in one place.
    """
    try:
        automated_cycle = CycleSettings.objects.get(id=automated_cycle_id, project_id=project_id)

        bot_member = ProjectMember.objects.filter(
            project_id=project_id,
            member__bot_type=BotTypeEnum.CYCLE_AUTOMATION_BOT,
        ).first()

        if not bot_member:
            return False

        _create_missing_future_cycles(automated_cycle, bot_member.member_id, timezone.now())
        return True
    except Exception as e:
        log_exception(e)
        return False


@shared_task
def schedule_cycle(automated_cycle_id: str, project_id: str, bot_id: str):
    try:
        """
        Schedule a cycle for a project based on the CycleSettings configuration.

        - Creates future cycles using the duration and cooldown period.
        - Skips cycles that overlap with existing ones.
        - Logs success or failure for each attempted cycle creation.
        """

        automated_cycle = CycleSettings.objects.get(id=automated_cycle_id, project_id=project_id)

        number_of_cycles = automated_cycle.number_of_cycles
        cycle_duration = automated_cycle.cycle_duration
        cooldown_period = automated_cycle.cooldown_period
        start_date = automated_cycle.start_date
        workspace_id = automated_cycle.workspace_id

        # Check if the project allows parallel (overlapping) cycles
        is_project_parallel = bool(
            ProjectFeature.objects.filter(project_id=project_id)
            .values_list("is_parallel_cycles_enabled", flat=True)
            .first()
        )
        allow_parallel = is_project_parallel and check_workspace_feature_flag(
            FeatureFlag.PARALLEL_CYCLES, automated_cycle.workspace.slug
        )

        desired_windows = []
        for i in range(number_of_cycles):
            start_dt = start_date + timedelta(days=i * (cycle_duration + cooldown_period))
            end_dt = start_dt + timedelta(days=cycle_duration - 1)
            desired_windows.append((start_dt, end_dt))

        # Prefetch all existing cycles in the same project/workspace that could possibly overlap
        existing_cycles = Cycle.objects.filter(
            project_id=project_id,
            workspace_id=workspace_id,
            deleted_at__isnull=True,
        ).values("start_date", "end_date")

        logs = []
        cycles_to_create = []
        base_title = automated_cycle.title.strip()
        next_sequence = _get_next_cycle_sequence(base_title, project_id, bot_id)

        for start_dt, end_dt in desired_windows:
            # When parallel cycles are allowed, skip the overlap check
            if not allow_parallel:
                is_clashing = any(
                    ec["start_date"] is not None
                    and ec["end_date"] is not None
                    and ec["start_date"] <= end_dt
                    and ec["end_date"] >= start_dt
                    for ec in existing_cycles
                )

                if is_clashing:
                    logs.append(
                        AutomatedCycleLog(
                            automated_cycle=automated_cycle,
                            workspace_id=workspace_id,
                            project_id=project_id,
                            cycle_id=None,
                            action="cycle_creation_failed",
                            status="failed",
                            message=f"Cycle window {start_dt.date()} - {end_dt.date()} overlaps with existing cycle.",
                            scheduled_at=timezone.now(),
                        )
                    )
                    continue

            start_dt = convert_to_utc(
                date=str(start_dt.date()),
                project_id=project_id,
                is_start_date=True,
            )
            end_dt = convert_to_utc(
                date=str(end_dt.date()),
                project_id=project_id,
            )

            # Create the cycle object
            cycle = Cycle(
                project_id=project_id,
                workspace_id=workspace_id,
                owned_by_id=bot_id,
                created_by_id=bot_id,
                updated_by_id=bot_id,
                name=_build_cycle_name(base_title, next_sequence),
                start_date=start_dt,
                end_date=end_dt,
            )
            cycles_to_create.append(cycle)
            next_sequence += 1
        # Bulk create non-conflicting cycles
        created_cycles = Cycle.objects.bulk_create(cycles_to_create, batch_size=50, ignore_conflicts=True)

        # Add logs for successful creations
        for cycle in created_cycles:
            logs.append(
                AutomatedCycleLog(
                    automated_cycle=automated_cycle,
                    workspace_id=workspace_id,
                    project_id=project_id,
                    cycle_id=cycle.id,
                    action="cycle_created",
                    status="success",
                    message=f"Cycle created successfully for {cycle.start_date.date()} - {cycle.end_date.date()}",
                    scheduled_at=timezone.now(),
                )
            )

        # Bulk create logs
        if logs:
            AutomatedCycleLog.objects.bulk_create(logs, batch_size=50)

        return True
    except Exception as e:
        log_exception(e)
        return False


@shared_task
def maintain_future_cycles():
    try:
        """
        Ensure each active CycleSettings has exactly `number_of_cycles` future cycles.
        - If a cycle started within the last 2 minutes, or a cycle will start within the
        next 2 minutes, backfill to keep the number of future cycles constant.
        - This runs idempotently and safely in concurrent environments.
        """

        now = timezone.now()
        buffer = timedelta(minutes=2)

        # from the project features table get the cycle enabled projects
        cycle_enabled_projects = ProjectFeature.objects.filter(
            is_automated_cycle_enabled=True, project__cycle_view=True
        ).values_list("project_id", flat=True)

        # check if the cycle is disabled for the projects
        scheduled_cycles = CycleSettings.objects.filter(project_id__in=cycle_enabled_projects)

        scheduled_cycles_projects = scheduled_cycles.values("project_id")

        # get the recently started cycles to create new future cycles
        # get the project's timezone time to check if the cycle has started is accurately respected .
        recently_started_cycles = Cycle.objects.filter(
            project_id__in=Subquery(scheduled_cycles_projects),
            deleted_at__isnull=True,
            start_date__gte=now - buffer,  # started within last 2 mins (inclusive)
            start_date__lte=now,  # up to now
        ).values("project_id", "id")

        # get the recently ended cycles to transfer work items
        recently_ended_cycles = Cycle.objects.filter(
            project_id__in=Subquery(scheduled_cycles_projects),
            deleted_at__isnull=True,
            end_date__gte=now - buffer,  # ended within last 2 mins (inclusive)
            end_date__lte=now,  # up to now
        ).values("project_id", "id")

        # check for auto-rollover enabled (placeholder for future use)
        scheduled_cycles.filter(is_auto_rollover_enabled=True).values_list("project_id", flat=True)

        # create the new cycles
        for cycle in recently_ended_cycles:
            project_id = cycle["project_id"]
            cycle_id = cycle["id"]

            project = Project.objects.get(id=project_id)

            # get the bot id
            bot_id = (
                ProjectMember.objects.filter(
                    project_id=project_id,
                    member__bot_type=BotTypeEnum.CYCLE_AUTOMATION_BOT,
                )
                .first()
                .member_id
            )

            # Fetch project for the specific record or pass project_id dynamically
            project_timezone = project.timezone

            # Convert the current time (timezone.now()) to the project's timezone
            local_tz = pytz.timezone(project_timezone)
            current_time_in_project_tz = timezone.now().astimezone(local_tz)

            # Convert project local time back to UTC for comparison (start_date is stored in UTC)
            current_time_in_utc = current_time_in_project_tz.astimezone(pytz.utc)

            scheduled_cycle = scheduled_cycles.filter(project_id=project_id).first()

            # transfer the work-items to the next cycle (if the next cycle exists)
            if scheduled_cycle.is_auto_rollover_enabled:
                workspace_slug = Workspace.objects.get(id=scheduled_cycle.workspace_id).slug

                # Check if the project allows parallel cycles
                is_project_parallel = (
                    ProjectFeature.objects.filter(project_id=project_id)
                    .values_list("is_parallel_cycles_enabled", flat=True)
                    .first()
                )
                allow_parallel = is_project_parallel and check_workspace_feature_flag(
                    FeatureFlag.PARALLEL_CYCLES, workspace_slug
                )

                # Find all currently active cycles excluding the one that just ended
                active_cycles = Cycle.objects.filter(
                    Q(start_date__lte=current_time_in_utc) & Q(end_date__gte=current_time_in_utc),
                    workspace__slug=workspace_slug,
                    project_id=project_id,
                    deleted_at__isnull=True,
                ).exclude(id=cycle_id)

                active_count = active_cycles.count()

                if allow_parallel and active_count > 1:
                    # get the next upcoming cycle created by the automation bot
                    next_cycle = (
                        Cycle.objects.filter(
                            workspace__slug=workspace_slug,
                            project_id=project_id,
                            start_date__gt=current_time_in_utc,
                            deleted_at__isnull=True,
                            owned_by_id=bot_id,
                        )
                        .order_by("start_date")
                        .first()
                    )
                    if next_cycle:
                        transfer_cycle_issues(
                            slug=workspace_slug,
                            project_id=project_id,
                            cycle_id=cycle_id,
                            new_cycle_id=next_cycle.id,
                            request=None,
                            user_id=str(bot_id),
                        )
                    else:
                        # if no next cycle is found then skip the rollover
                        pass
                    # Multiple active cycles exist — rollover target is ambiguous, skip
                    pass
                elif active_count == 1:
                    # Exactly one other active cycle — transfer issues into it
                    transfer_cycle_issues(
                        slug=workspace_slug,
                        project_id=project_id,
                        cycle_id=cycle_id,
                        new_cycle_id=str(active_cycles.first().id),
                        request=None,
                        user_id=str(bot_id),
                    )
                else:
                    # No other active cycle — fall back to the next upcoming cycle
                    next_cycle = (
                        Cycle.objects.filter(
                            workspace__slug=workspace_slug,
                            project_id=project_id,
                            start_date__gt=current_time_in_utc,
                            deleted_at__isnull=True,
                        )
                        .order_by("start_date")
                        .first()
                    )
                    if next_cycle:
                        transfer_cycle_issues(
                            slug=workspace_slug,
                            project_id=project_id,
                            cycle_id=cycle_id,
                            new_cycle_id=next_cycle.id,
                            request=None,
                            user_id=str(bot_id),
                        )

        for cycle in recently_started_cycles:
            project_id = cycle["project_id"]

            bot_member = ProjectMember.objects.filter(
                project_id=project_id,
                member__bot_type=BotTypeEnum.CYCLE_AUTOMATION_BOT,
            ).first()
            if not bot_member:
                continue

            scheduled_cycle = scheduled_cycles.filter(project_id=project_id).first()
            if not scheduled_cycle:
                continue

            _create_missing_future_cycles(scheduled_cycle, bot_member.member_id, now)
    except Exception as e:
        log_exception(e)
        return False
