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

# Django imports
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import Workspace, Project
from plane.ee.bgtasks.auto_reminder_automation.task import AutomationAutoReminderTask


class Command(BaseCommand):
    help = "Run the auto-reminder automation task"

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, help="workspace slug", required=False)
        parser.add_argument("--project", type=str, help="project id", required=False)
        parser.add_argument("--global", action="store_true", help="run the automation for all projects", required=False)
    def handle(self, *args, **options):
        try:
            workspace_slug = (options.get("slug") or "").strip() or None
            project_id = (options.get("project") or "").strip() or None
            global_mode = options.get("global", False)

            workspace = None
            project = None

            if not global_mode:
                # if workspace slug is not provided, ask for it
                if not workspace_slug:
                    workspace_slug = input("Workspace slug: ").strip() or None

                # if project id is not provided, ask for it
                if not project_id:
                    project_id = input("Project id: ").strip() or None

                # if workspace slug and project id are not provided, raise an error
                if not workspace_slug and not project_id:
                    raise CommandError("Error: Workspace slug or project id is required")

                # resolve workspace (required when project_id is set; optional when workspace_slug only)
                if workspace_slug:
                    workspace = Workspace.objects.filter(slug=workspace_slug).first()
                    if not workspace:
                        raise CommandError(f"Error: Workspace with slug {workspace_slug} does not exist")

                # fetch the project only when project_id is provided
                if project_id:
                    if not workspace:
                        raise CommandError("Error: Workspace slug is required when specifying a project")
                    project = Project.objects.filter(id=project_id, workspace=workspace).first()
                    if not project:
                        raise CommandError(
                            f"Error: Project with id {project_id} does not exist in workspace {workspace_slug}"
                        )

            if global_mode:
                if workspace_slug is not None or project_id is not None:
                    self.stdout.write(
                        self.style.WARNING(
                            "NOTE: --slug/--project flags are ignored in global mode. "
                            "Reminders will run for ALL eligible projects across ALL workspaces."
                        )
                    )
                workspace_slug = None
                project_id = None

            # run the auto-reminder automation task
            total_notifications_created, total_email_notifications_created = AutomationAutoReminderTask(
                workspace_slug=workspace_slug, project_id=project_id
            ).execute()

            if global_mode:
                self.stdout.write(
                    self.style.SUCCESS("Auto-reminder automation task executed successfully in global mode")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS("Auto-reminder automation task executed successfully in workspace/project mode")
                )
                if workspace:
                    self.stdout.write(self.style.SUCCESS(f"Workspace: {workspace.name}"))
                if project:
                    self.stdout.write(self.style.SUCCESS(f"Project: {project.name}"))

            self.stdout.write(self.style.SUCCESS(f"Total notifications: {total_notifications_created}"))
            self.stdout.write(self.style.SUCCESS(f"Total email logs: {total_email_notifications_created}"))

        except CommandError:
            raise
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
            raise CommandError(str(e)) from e
