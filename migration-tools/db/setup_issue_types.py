# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from typing import Any
import json

from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import Workspace, Project, Issue, IssueType
from plane.db.models.issue_type import ProjectIssueType

# The planning model (migration-karol.md §5.4, revised 2026-09-08): the
# hierarchy stages (SP/T/ST) are carried by the item prefixes, so the type set
# is just Plan / Ticket / Design. The former Subplan/Task/Subtask types are
# migrated to Plan (issues reassigned, types deleted) — idempotently.
TYPE_SPECS = [
    {"name": "Plan", "color": "#3f76ff"},
    {"name": "Ticket", "color": "#f59e0b"},
    {"name": "Design", "color": "#8b5cf6"},
]
REMOVED_TYPE_NAMES = ["Subplan", "Task", "Subtask"]


class Command(BaseCommand):
    """Create workspace-level issue types and enable them for a project.

    Prints a JSON map {"Plan": "<uuid>", ...} to stdout — save it to
    migration-tools/state/types.json for the importer.

    Usage (inside the api container):
      python manage.py setup_issue_types --workspace-slug main --project-id <uuid>
    """

    help = "Create issue types (Plan/Ticket/Design) and enable them for a project"

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
        for spec in TYPE_SPECS:
            issue_type, _ = IssueType.objects.get_or_create(
                workspace=workspace, name=spec["name"], defaults={"color": spec["color"]}
            )
            if issue_type.color != spec["color"]:
                issue_type.color = spec["color"]
                issue_type.save(update_fields=["color"])
            ProjectIssueType.objects.get_or_create(project=project, issue_type=issue_type)
            result[spec["name"]] = str(issue_type.id)

        # Migrate the removed hierarchy types → Plan (reassign issues, then delete)
        plan_type = IssueType.objects.get(workspace=workspace, name="Plan")
        removed = IssueType.objects.filter(workspace=workspace, name__in=REMOVED_TYPE_NAMES)
        for removed_type in removed:
            reassigned = Issue.objects.filter(workspace=workspace, type=removed_type).update(type=plan_type)
            if reassigned:
                self.stdout.write(f"  reassigned {reassigned} issues from '{removed_type.name}' → Plan")
            removed_type.delete()  # cascades ProjectIssueType rows

        # Ticket is the default type for new issues (e.g. app-reported ones)
        ticket = IssueType.objects.get(workspace=workspace, name="Ticket")
        ProjectIssueType.objects.filter(project=project, issue_type=ticket).update(is_default=True)

        project.is_issue_type_enabled = True
        project.save(update_fields=["is_issue_type_enabled"])

        self.stdout.write(json.dumps(result))
