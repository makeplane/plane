# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Retire the workspaces that the two-workspace model replaces.

Usage (inside the API container):

    python manage.py purge_workspaces --slugs fangyikai,testworkspace,testtest
    python manage.py purge_workspaces --slugs fangyikai --yes

Take a database dump first: the deletion is permanent.
"""

from django.core.management.base import BaseCommand, CommandError

from plane.db.models import Project, Workspace, WorkspaceMember
from plane.research.services.maintenance import purge_workspace, workspace_counts


class Command(BaseCommand):
    help = "Delete workspaces (and their research data) by slug. Accounts are kept."

    def add_arguments(self, parser):
        parser.add_argument(
            "--slugs",
            required=True,
            help="Comma separated workspace slugs, e.g. fangyikai,testworkspace",
        )
        parser.add_argument("--yes", action="store_true", help="confirm the deletion")

    def handle(self, *args, **options):
        slugs = [slug.strip() for slug in str(options["slugs"]).split(",") if slug.strip()]
        if not slugs:
            raise CommandError("--slugs must list at least one workspace slug")

        workspaces = list(Workspace.objects.filter(slug__in=slugs, deleted_at__isnull=True))
        found = {workspace.slug for workspace in workspaces}
        missing = [slug for slug in slugs if slug not in found]

        if not workspaces:
            self.stdout.write(self.style.WARNING("No matching workspace found."))
            return

        for workspace in workspaces:
            counts = workspace_counts(workspace)
            self.stdout.write(f"\n[{workspace.slug}] {workspace.name}")
            self.stdout.write(
                "  members="
                f"{WorkspaceMember.objects.filter(workspace=workspace).count()} "
                f"projects={Project.objects.filter(workspace=workspace).count()}"
            )
            for model_name, count in sorted(counts.items()):
                if count:
                    self.stdout.write(f"  research {model_name}: {count}")

        if missing:
            self.stdout.write(self.style.WARNING(f"Already gone: {', '.join(missing)}"))

        if not options["yes"]:
            self.stdout.write(
                self.style.WARNING("\nDry run. Re-run with --yes to delete the workspaces above.")
            )
            return

        for workspace in workspaces:
            deleted, remaining = purge_workspace(workspace)
            if remaining:
                self.stdout.write(
                    self.style.ERROR(
                        f"Could not finish {workspace.slug}: "
                        + ", ".join(f"{name}={count}" for name, count in remaining.items())
                    )
                )
                continue
            raw_tables = deleted.pop("_raw_tables", [])
            total = sum(deleted.values())
            self.stdout.write(
                self.style.SUCCESS(f"Deleted workspace {workspace.slug} ({total} research rows removed).")
            )
            if raw_tables:
                self.stdout.write(
                    self.style.WARNING(
                        f"  append-only tables cleared: {', '.join(raw_tables)} (database dump taken first)"
                    )
                )
        self.stdout.write(self.style.SUCCESS("\nDone. Accounts (users) were kept."))
