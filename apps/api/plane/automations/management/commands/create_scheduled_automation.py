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
Interactive management command to create scheduled automations at the project level.

Scheduled automations are entity-less (no work item context), so the only
supported action is `run_script` which executes a runner script on a cron
or fixed schedule.

Usage:
    python manage.py create_scheduled_automation
    python manage.py create_scheduled_automation --workspace-id <uuid> --project-id <uuid>
"""

import json
import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from plane.db.models import Workspace, Project
from plane.ee.models.automation import (
    Automation,
    AutomationNode,
    AutomationEdge,
    AutomationScopeChoices,
    NodeTypeChoices,
)


VALID_DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


class Command(BaseCommand):
    help = "Interactively create a scheduled automation at the project level"

    def __init__(self):
        super().__init__()
        self.workspace = None
        self.project = None

    def add_arguments(self, parser):
        parser.add_argument(
            "--workspace-id",
            type=str,
            help="Workspace UUID (skip interactive prompt)",
        )
        parser.add_argument(
            "--project-id",
            type=str,
            help="Project UUID (skip interactive prompt)",
        )

    def handle(self, *args, **options):
        try:
            self.stdout.write(self.style.SUCCESS(
                "Scheduled Automation Creator\n"
                "Creates: Trigger (scheduled) -> Action (run_script)\n"
            ))

            # Step 1-2: Workspace & Project
            self._get_workspace_and_project(options)

            # Step 3: Automation details
            name, description = self._get_automation_details()

            # Step 4-6: Schedule config
            trigger_config = self._get_schedule_config()

            # Step 7: Script config
            action_config = self._get_script_config()

            # Step 8: Review
            self._print_summary(name, description, trigger_config, action_config)
            if not self._confirm("Create this automation?"):
                self.stdout.write("Cancelled.")
                return

            publish = self._confirm("Publish and enable immediately?")

            # Step 9: Create
            with transaction.atomic():
                automation = Automation.objects.create(
                    name=name,
                    description=description,
                    scope=AutomationScopeChoices.WORKITEM,
                    workspace=self.workspace,
                    project=self.project,
                )

                version = automation.create_new_version()

                trigger_node = AutomationNode.objects.create(
                    version=version,
                    name="Trigger: scheduled",
                    node_type=NodeTypeChoices.TRIGGER,
                    handler_name="scheduled",
                    config=trigger_config,
                    project=self.project,
                )

                action_node = AutomationNode.objects.create(
                    version=version,
                    name="Action: run_script",
                    node_type=NodeTypeChoices.ACTION,
                    handler_name="run_script",
                    config=action_config,
                    project=self.project,
                )

                AutomationEdge.objects.create(
                    version=version,
                    source_node=trigger_node,
                    target_node=action_node,
                    execution_order=0,
                    project=self.project,
                )

                if publish:
                    automation.publish_version(version)
                    automation.is_enabled = True
                    automation.save(update_fields=["is_enabled"])

            status_label = "published & enabled" if publish else "draft"
            self.stdout.write(self.style.SUCCESS(
                f"\nAutomation created ({status_label})\n"
                f"  ID:          {automation.id}\n"
                f"  Version:     {version.version_number}\n"
                f"  Next run at: {trigger_node.next_scheduled_at}"
            ))

        except KeyboardInterrupt:
            self.stdout.write(self.style.ERROR("\nCancelled."))
        except CommandError:
            raise
        except Exception as e:
            raise CommandError(str(e))

    # ------------------------------------------------------------------
    # Step 1-2: Workspace & Project
    # ------------------------------------------------------------------

    def _get_workspace_and_project(self, options):
        workspace_id = options.get("workspace_id")
        project_id = options.get("project_id")

        if not workspace_id:
            workspace_id = self._prompt("Workspace ID or slug", required=True)

        # Try as UUID first, then slug
        try:
            uuid.UUID(workspace_id)
            self.workspace = Workspace.objects.get(id=workspace_id)
        except (ValueError, Workspace.DoesNotExist):
            try:
                self.workspace = Workspace.objects.get(slug=workspace_id)
            except Workspace.DoesNotExist:
                raise CommandError(f"Workspace not found: {workspace_id}")

        self.stdout.write(f"  Workspace: {self.workspace.name} ({self.workspace.slug})")

        if not project_id:
            project_id = self._prompt("Project ID", required=True, validator=self._is_valid_uuid)

        try:
            self.project = Project.objects.get(id=project_id, workspace=self.workspace)
        except Project.DoesNotExist:
            raise CommandError(f"Project {project_id} not found in workspace '{self.workspace.name}'")

        self.stdout.write(f"  Project:   {self.project.name}\n")

    # ------------------------------------------------------------------
    # Step 3: Automation details
    # ------------------------------------------------------------------

    def _get_automation_details(self):
        self.stdout.write(self.style.HTTP_INFO("Automation Details"))
        name = self._prompt("Name", required=True)
        description = self._prompt("Description (optional)")
        self.stdout.write("")
        return name, description or ""

    # ------------------------------------------------------------------
    # Step 4-6: Schedule config
    # ------------------------------------------------------------------

    def _get_schedule_config(self):
        self.stdout.write(self.style.HTTP_INFO("Schedule Configuration"))
        self.stdout.write("  1. Fixed schedule (daily/weekly/monthly/yearly)")
        self.stdout.write("  2. Cron expression")

        choice = self._prompt("Method [1/2]", required=True)
        while choice not in ("1", "2"):
            choice = self._prompt("Enter 1 or 2", required=True)

        if choice == "1":
            config = self._get_fixed_schedule()
        else:
            config = self._get_cron_schedule()

        # Validate
        from plane.automations.nodes.triggers import ScheduledTriggerParams

        try:
            ScheduledTriggerParams(**config)
        except Exception as e:
            raise CommandError(f"Invalid schedule: {e}")

        self.stdout.write(self.style.SUCCESS("  Schedule validated.\n"))
        return config

    def _get_fixed_schedule(self):
        config = {"method": "fixed"}

        self.stdout.write("\n  Frequencies: daily, weekly, monthly, yearly")
        frequency = self._prompt("Frequency", required=True)
        while frequency not in ("daily", "weekly", "monthly", "yearly"):
            frequency = self._prompt("Enter daily/weekly/monthly/yearly", required=True)
        config["frequency"] = frequency

        if frequency == "weekly":
            self.stdout.write(f"  Valid days: {', '.join(VALID_DAYS)}")
            days_str = self._prompt("Days (comma-separated)", required=True)
            days = [d.strip().lower() for d in days_str.split(",")]
            for d in days:
                if d not in VALID_DAYS:
                    raise CommandError(f"Invalid day: {d}. Use: {', '.join(VALID_DAYS)}")
            config["days"] = days

        if frequency in ("monthly", "yearly"):
            day_of_month = self._prompt_int("Day of month (1-31)", 1, 31)
            config["day_of_month"] = day_of_month

        if frequency == "yearly":
            month = self._prompt_int("Month (1-12)", 1, 12)
            config["month"] = month

        hour = self._prompt_int("Hour (0-23)", 0, 23)
        minute = self._prompt_int("Minute (0-59)", 0, 59)
        config["hour"] = hour
        config["minute"] = minute

        tz = self._prompt("Timezone (optional, e.g. Asia/Kolkata)")
        if tz:
            config["timezone"] = tz

        return config

    def _get_cron_schedule(self):
        config = {"method": "cron"}

        cron_expr = self._prompt("Cron expression (e.g. '0 9 * * 1-5')", required=True)
        config["cron_expression"] = cron_expr

        tz = self._prompt("Timezone (optional, e.g. UTC)")
        if tz:
            config["timezone"] = tz

        return config

    # ------------------------------------------------------------------
    # Step 7: Script config
    # ------------------------------------------------------------------

    def _get_script_config(self):
        self.stdout.write(self.style.HTTP_INFO("Runner Script"))

        script_id = self._prompt("Script ID (UUID)", required=True, validator=self._is_valid_uuid)

        exec_vars = {}
        if self._confirm("Add execution variables?", default=False):
            vars_json = self._prompt('Variables as JSON (e.g. {"key": "value"})', required=True)
            try:
                exec_vars = json.loads(vars_json)
                if not isinstance(exec_vars, dict):
                    raise CommandError("Execution variables must be a JSON object")
            except json.JSONDecodeError as e:
                raise CommandError(f"Invalid JSON: {e}")

        config = {"script_id": script_id, "execution_variables": exec_vars}

        from plane.automations.nodes.actions import RunScriptParams

        try:
            RunScriptParams(**config)
        except Exception as e:
            raise CommandError(f"Invalid script config: {e}")

        self.stdout.write(self.style.SUCCESS("  Script config validated.\n"))
        return config

    # ------------------------------------------------------------------
    # Step 8: Summary
    # ------------------------------------------------------------------

    def _print_summary(self, name, description, trigger_config, action_config):
        self.stdout.write(self.style.HTTP_INFO("\nReview"))
        self.stdout.write(f"  Workspace:  {self.workspace.name}")
        self.stdout.write(f"  Project:    {self.project.name}")
        self.stdout.write(f"  Name:       {name}")
        if description:
            self.stdout.write(f"  Description: {description}")

        method = trigger_config["method"]
        if method == "fixed":
            freq = trigger_config["frequency"]
            time_str = f"{trigger_config['hour']:02d}:{trigger_config['minute']:02d}"
            tz = trigger_config.get("timezone", "project/workspace default")
            schedule_str = f"{freq} at {time_str} ({tz})"
            if freq == "weekly":
                schedule_str += f" on {', '.join(trigger_config['days'])}"
            elif freq in ("monthly", "yearly"):
                schedule_str += f" on day {trigger_config['day_of_month']}"
            if freq == "yearly":
                schedule_str += f" of month {trigger_config['month']}"
        else:
            schedule_str = f"cron: {trigger_config['cron_expression']}"
            tz = trigger_config.get("timezone")
            if tz:
                schedule_str += f" ({tz})"

        self.stdout.write(f"  Schedule:   {schedule_str}")
        self.stdout.write(f"  Script ID:  {action_config['script_id']}")
        if action_config.get("execution_variables"):
            self.stdout.write(f"  Variables:  {json.dumps(action_config['execution_variables'])}")
        self.stdout.write("")

    # ------------------------------------------------------------------
    # Input helpers
    # ------------------------------------------------------------------

    def _prompt(self, label, required=False, validator=None):
        while True:
            value = input(f"  {label}: ").strip()
            if required and not value:
                self.stdout.write("    Required. Try again.")
                continue
            if value and validator and not validator(value):
                self.stdout.write("    Invalid input. Try again.")
                continue
            return value

    def _prompt_int(self, label, min_val, max_val):
        while True:
            raw = self._prompt(label, required=True)
            try:
                val = int(raw)
                if min_val <= val <= max_val:
                    return val
                self.stdout.write(f"    Must be between {min_val} and {max_val}.")
            except ValueError:
                self.stdout.write("    Enter a number.")

    def _confirm(self, message, default=True):
        hint = "Y/n" if default else "y/N"
        response = input(f"  {message} ({hint}): ").strip().lower()
        if not response:
            return default
        return response in ("y", "yes")

    @staticmethod
    def _is_valid_uuid(value):
        try:
            uuid.UUID(value)
            return True
        except ValueError:
            return False
