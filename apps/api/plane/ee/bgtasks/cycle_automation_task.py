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

from __future__ import annotations
import pytz

# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone
from django.db.models import Subquery

# Third Party imports
from celery import shared_task
from django.db.models import Q

# Module imports
from plane.ee.models import CycleSettings, ProjectFeature, AutomatedCycleLog
from plane.db.models import Cycle, Project, Workspace
from plane.db.models import BotTypeEnum, ProjectMember
from plane.utils.exception_logger import log_exception
from plane.utils.cycle_transfer_issues import transfer_cycle_issues
from plane.utils.timezone_converter import convert_to_utc


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

        for start_dt, end_dt in desired_windows:
            # Check if there's any overlap
            is_clashing = any((ec["start_date"] <= end_dt and ec["end_date"] >= start_dt) for ec in existing_cycles)

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
                name=automated_cycle.title,
                start_date=start_dt,
                end_date=end_dt,
            )
            cycles_to_create.append(cycle)

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

                # first check if the current active cycle is not the same as the old cycle
                current_cycle = (
                    Cycle.objects.filter(
                        Q(start_date__lte=current_time_in_utc) & Q(end_date__gte=current_time_in_utc),
                        workspace__slug=workspace_slug,
                        project_id=project_id,
                        deleted_at__isnull=True,
                    )
                    .order_by("start_date")
                    .first()
                )
                if current_cycle and current_cycle.id != cycle_id:
                    transfer_cycle_issues(
                        slug=workspace_slug,
                        project_id=project_id,
                        cycle_id=cycle_id,
                        new_cycle_id=current_cycle.id,
                        request=None,
                        user_id=str(bot_id),
                    )
                else:
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
            scheduled_cycle = scheduled_cycles.filter(project_id=project_id).first()

            # get the number of cycles to create
            number_of_cycles = scheduled_cycle.number_of_cycles
            cycle_duration = scheduled_cycle.cycle_duration
            cooldown_period = scheduled_cycle.cooldown_period
            project_id = scheduled_cycle.project_id
            workspace_id = scheduled_cycle.workspace_id

            # get the upcoming cycles which are scheduled for the project
            upcoming_cycles = Cycle.objects.filter(project_id=project_id, start_date__gt=now, deleted_at__isnull=True)

            # get then end date of the last created cycle and then add the cooldown period and create the new cycle.
            last_cycle = upcoming_cycles.order_by("-end_date").first()
            if last_cycle:
                last_cycle_end_date = last_cycle.end_date + timedelta(days=cooldown_period)
            else:
                # if there are no upcoming cycles then check for the start date and start the cycles from the next day
                last_upcoming = upcoming_cycles.order_by("-start_date").first()
                last_cycle_end_date = (
                    last_upcoming.start_date + timedelta(days=cooldown_period) if last_upcoming else now
                )

                # if the last cycles is not found then check for which every is the upcoming cycle as the end date
                # (if none of them have end date then skip the project)
                upcoming_cycles = Cycle.objects.filter(
                    project_id=project_id, start_date__gt=now, deleted_at__isnull=True
                )
                if not upcoming_cycles.exists():
                    # create the new and the future cycles
                    schedule_cycle(
                        automated_cycle_id=scheduled_cycle.id,
                        project_id=project_id,
                        bot_id=bot_id,
                    )
                    continue

            # check the difference between the number of cycles and the upcoming cycles
            number_of_cycles_diff = number_of_cycles - upcoming_cycles.count()

            # if its greater than create the new cycles from the last cycle end date and
            # add the cool down period and bulk create the cycles

            # first we need to check if any of the cycles exists with the same dates in the database
            if number_of_cycles_diff > 0:
                # Build cycles list with proper UTC conversion for each cycle
                cycles_to_create = []
                for i in range(number_of_cycles_diff):
                    start_dt = last_cycle_end_date + timedelta(days=i * (cycle_duration + cooldown_period) + 1)
                    end_dt = start_dt + timedelta(days=cycle_duration - 1)

                    # Convert dates to UTC using the project's timezone
                    start_date = convert_to_utc(
                        date=str(start_dt.date()),
                        project_id=project_id,
                        is_start_date=True,
                    )
                    end_date = convert_to_utc(
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
                            name=scheduled_cycle.title,
                            start_date=start_date,
                            end_date=end_date,
                        )
                    )

                # bulk create the cycles
                cycles = Cycle.objects.bulk_create(
                    cycles_to_create,
                    batch_size=50,
                    ignore_conflicts=True,
                )

                AutomatedCycleLog.objects.bulk_create(
                    [
                        AutomatedCycleLog(
                            automated_cycle=scheduled_cycle,
                            cycle=cycle,
                            workspace_id=workspace_id,
                            project_id=project_id,
                            action="cycle_created",
                            status="success",
                            message=f"Cycle created successfully for {cycle.start_date.date()} - {cycle.end_date.date()}",  # noqa: E501
                            scheduled_at=timezone.now(),
                        )
                        for cycle in cycles
                    ]
                )
    except Exception as e:
        log_exception(e)
        return False
