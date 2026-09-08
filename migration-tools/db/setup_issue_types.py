# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from typing import Any
import json

from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import Workspace, Project, IssueType
from plane.db.models.issue_type import ProjectIssueType

# The planning model (migration-karol.md §5.4): PLAN → SP → T → ST as nested
# work items, tickets separate, design docs as their own type. Issue types are
# DB-only in this Plane version (no API endpoints), so they are created here.
TYPE_NAMES = ["Plan", "Subplan", "Task", "Subtask", "Ticket", "Design"]


class Command(BaseCommand):
    """Create workspace-level issue types and enable them for a project.

    Prints a JSON map {"Plan": "<uuid>", ...} to stdout — save it to
    migration-tools/state/types.json for the importer.

    Usage (inside the api container):
      python manage.py setup_issue_types --workspace-slug main --project-id <uuid>
    """

    help = "Create issue types (Plan/Subplan/Task/Subtask/Ticket) and enable them for a project"

    def add_arguments(self, parser):
        parser.add_argument("--workspace-slug", type=str, required=True)
        parser.add_argument("--project-id", type=str, required=True)

    def handle(self, *args: Any, **options: Any):
        # argparse converts --workspace-slug to dest workspace_slug
        workspace = Workspace.objects.filter(slug=options["workspace_slug"]).first()
        if not workspace:
            raise CommandError(f"Workspace '{options['workspace_slug']}' not found")

        project = Project.objects.filter(pk=options["project_id"]).first()
        if not project:
            raise CommandError(f"Project '{options['project_id']}' not found")

        result = {}
        for name in TYPE_NAMES:
            issue_type, _ = IssueType.objects.get_or_create(workspace=workspace, name=name)
            ProjectIssueType.objects.get_or_create(project=project, issue_type=issue_type)
            result[name] = str(issue_type.id)

        # Ticket is the default type for new issues (e.g. app-reported ones)
        ticket = IssueType.objects.get(workspace=workspace, name="Ticket")
        ProjectIssueType.objects.filter(project=project, issue_type=ticket).update(is_default=True)

        project.is_issue_type_enabled = True
        project.save(update_fields=["is_issue_type_enabled"])

        self.stdout.write(json.dumps(result))
