# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Apply PROJECT.md's engineering workflow to a workspace.

    python manage.py bootstrap_engineering_ops --workspace hgn
    python manage.py bootstrap_engineering_ops --workspace hgn --project <uuid> --dry-run

Additive and idempotent: states, labels and issue types that already exist are
left exactly as they are, and nothing is ever deleted.
"""

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

# Module imports
from workspaces.db.models import Project, Workspace
from workspaces.utils.engineering_ops import (
    ENGINEERING_ISSUE_TYPES,
    ENGINEERING_LABELS,
    ENGINEERING_WORKFLOW_STATES,
)
from workspaces.utils.engineering_ops_setup import bootstrap_workspace


class Command(BaseCommand):
    help = "Create the engineering workflow states, labels and issue types in a workspace."

    def add_arguments(self, parser):
        parser.add_argument("--workspace", required=True, help="Workspace slug")
        parser.add_argument(
            "--project",
            action="append",
            default=[],
            help="Limit to one project id. Repeatable; omit to cover every project.",
        )
        parser.add_argument(
            "--no-issue-types",
            action="store_true",
            help="Skip issue types (they are workspace-wide and affect every project).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be created and roll back.",
        )

    def handle(self, *args, **options):
        try:
            workspace = Workspace.objects.get(slug=options["workspace"])
        except Workspace.DoesNotExist:
            raise CommandError(f"No workspace with slug {options['workspace']!r}.")

        project_ids = options["project"] or None
        if project_ids:
            found = set(
                str(pk)
                for pk in Project.objects.filter(workspace=workspace, id__in=project_ids).values_list("id", flat=True)
            )
            missing = [pk for pk in project_ids if pk not in found]
            if missing:
                raise CommandError(f"Not in this workspace: {', '.join(missing)}")

        self.stdout.write(
            f"Applying {len(ENGINEERING_WORKFLOW_STATES)} states, {len(ENGINEERING_LABELS)} labels"
            f"{'' if options['no_issue_types'] else f' and {len(ENGINEERING_ISSUE_TYPES)} issue types'}"
            f" to {workspace.slug}."
        )

        # A dry run does the real work and then throws it away, so the report
        # is what would actually happen rather than a guess at it.
        try:
            with transaction.atomic():
                result = bootstrap_workspace(
                    workspace=workspace,
                    project_ids=project_ids,
                    include_issue_types=not options["no_issue_types"],
                )
                if options["dry_run"]:
                    raise _DryRun(result)
        except _DryRun as rollback:
            self.report(rollback.result)
            self.stdout.write(self.style.WARNING("Dry run -- nothing was saved."))
            return

        self.report(result)
        self.stdout.write(self.style.SUCCESS("Done."))

    def report(self, result):
        for project in result["projects"]:
            states = project["states"]
            labels = project["labels"]
            self.stdout.write(f"  {project['name']}")
            self.stdout.write(f"    states:  +{len(states['created'])} {', '.join(states['created']) or '(none)'}")
            for rename in states["renamed"]:
                self.stdout.write(f"    renamed: {rename['from']} -> {rename['to']}")
            self.stdout.write(f"    labels:  +{len(labels['created'])}")

        issue_types = result.get("issue_types")
        if issue_types:
            self.stdout.write(
                f"  issue types: +{len(issue_types['created'])} created, {issue_types['enabled']} project links"
            )


class _DryRun(Exception):
    """Carries the result out of the rolled-back transaction."""

    def __init__(self, result):
        super().__init__("dry run")
        self.result = result
