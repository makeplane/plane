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
from plane.bgtasks.copy_project_data_task import copy_project_data
from plane.db.models import Project, Workspace


class Command(BaseCommand):
    help = "Copy a project from one workspace to another"

    def add_arguments(self, parser):
        parser.add_argument(
            "--source-workspace-slug",
            type=str,
            required=True,
            help="Source workspace slug",
        )
        parser.add_argument(
            "--source-project-identifier",
            type=str,
            required=True,
            help="Source project identifier",
        )
        parser.add_argument(
            "--target-workspace-slug",
            type=str,
            required=True,
            help="Target workspace slug",
        )
        parser.add_argument(
            "--new-project-name",
            type=str,
            required=False,
            help="New project name (optional, defaults to original)",
        )
        parser.add_argument(
            "--new-project-identifier",
            type=str,
            required=False,
            help="New project identifier (optional, auto-generated if not provided)",
        )

        parser.add_argument(
            "--background",
            action="store_true",
            help="Run in background via Celery (default is direct/synchronous)",
        )

    def _generate_unique_identifier(self, workspace, base_identifier):
        """Generate a unique identifier for the target workspace."""
        # First try the base identifier
        if not Project.objects.filter(
            workspace=workspace, identifier=base_identifier, deleted_at__isnull=True
        ).exists():
            return base_identifier

        # Try with _COPY suffix
        copy_identifier = f"{base_identifier[:8]}_COPY"[:12]
        if not Project.objects.filter(
            workspace=workspace, identifier=copy_identifier, deleted_at__isnull=True
        ).exists():
            return copy_identifier

        # Try with numeric suffix
        for i in range(1, 100):
            new_identifier = f"{base_identifier[:9]}_{i}"[:12]
            if not Project.objects.filter(
                workspace=workspace, identifier=new_identifier, deleted_at__isnull=True
            ).exists():
                return new_identifier

        raise CommandError(f"Could not generate a unique identifier for project in workspace {workspace.slug}")

    def handle(self, *args, **options):
        source_workspace_slug = options["source_workspace_slug"]
        source_project_identifier = options["source_project_identifier"].strip().upper()
        target_workspace_slug = options["target_workspace_slug"]
        new_project_name = options.get("new_project_name")
        new_project_identifier = options.get("new_project_identifier")
        run_background = options.get("background", False)

        # Validate source workspace
        source_workspace = Workspace.objects.filter(slug=source_workspace_slug).first()
        if not source_workspace:
            raise CommandError(f"Source workspace '{source_workspace_slug}' not found")

        # Validate source project
        source_project = Project.objects.filter(
            workspace=source_workspace,
            identifier=source_project_identifier,
            deleted_at__isnull=True,
        ).first()
        if not source_project:
            raise CommandError(
                f"Project with identifier '{source_project_identifier}' not found in workspace '{source_workspace_slug}'"  # noqa: E501
            )

        # Validate target workspace
        target_workspace = Workspace.objects.filter(slug=target_workspace_slug).first()
        if not target_workspace:
            raise CommandError(f"Target workspace '{target_workspace_slug}' not found")

        # Validate target workspace has an owner
        if not target_workspace.owner:
            raise CommandError(f"Target workspace '{target_workspace_slug}' does not have an owner")

        # Set default name if not provided
        if not new_project_name:
            new_project_name = source_project.name

        # Validate new project name is unique in target workspace
        if Project.objects.filter(
            workspace=target_workspace,
            name=new_project_name,
            deleted_at__isnull=True,
        ).exists():
            raise CommandError(
                f"Project with name '{new_project_name}' already exists in workspace '{target_workspace_slug}'"
            )

        # Generate or validate identifier
        if new_project_identifier:
            new_project_identifier = new_project_identifier.strip().upper()[:12]
            if Project.objects.filter(
                workspace=target_workspace,
                identifier=new_project_identifier,
                deleted_at__isnull=True,
            ).exists():
                raise CommandError(
                    f"Project with identifier '{new_project_identifier}' already exists in workspace '{target_workspace_slug}'"  # noqa: E501
                )
        else:
            new_project_identifier = self._generate_unique_identifier(target_workspace, source_project.identifier)

        self.stdout.write(
            self.style.SUCCESS(
                f"Copying project '{source_project.name}' ({source_project.identifier}) "
                f"from '{source_workspace_slug}' to '{target_workspace_slug}'"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"New project will be named '{new_project_name}' with identifier '{new_project_identifier}'"
            )
        )

        if run_background:
            self.stdout.write(self.style.WARNING("Running in background via Celery..."))
            copy_project_data.delay(
                str(source_project.id),
                str(target_workspace.id),
                new_project_name,
                new_project_identifier,
            )
            self.stdout.write(
                self.style.SUCCESS("Project copy task queued successfully. Check Celery logs for progress.")
            )
        else:
            self.stdout.write(self.style.WARNING("Running directly..."))
            copy_project_data(
                str(source_project.id),
                str(target_workspace.id),
                new_project_name,
                new_project_identifier,
            )
            self.stdout.write(self.style.SUCCESS("Project copy completed successfully"))
