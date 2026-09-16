# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Seed (or reset) the research test fixture of one workspace.

Usage (inside the API container):

    python manage.py seed_research_demo
    python manage.py seed_research_demo --reset
    python manage.py seed_research_demo --wipe            # dry run, prints counts
    python manage.py seed_research_demo --wipe --yes      # really delete
    python manage.py seed_research_demo --verify
    python manage.py seed_research_demo --no-files

See ``docs/research-test-fixtures.md`` for the account list and the manual
walkthrough.
"""

from typing import Any

from django.core.management.base import BaseCommand, CommandError

from plane.db.models import User, Workspace, WorkspaceMember
from plane.research.seed import scenario
from plane.research.seed.builder import (
    ResearchSeedBuilder,
    perform_wipe,
    reset_seed,
    seeded_projects,
    wipe_research_data,
)
from plane.research.seed.verify import format_matrix, verify

WORKSPACE_ADMIN_ROLE = 20


class Command(BaseCommand):
    help = "Seed multi-identity research fixtures (P0 + P1) into a workspace"

    def add_arguments(self, parser):
        parser.add_argument(
            "--workspace",
            default=scenario.DEFAULT_WORKSPACE_SLUG,
            help=" workspace slug (default: %s)" % scenario.DEFAULT_WORKSPACE_SLUG,
        )
        parser.add_argument(
            "--owner-email",
            default=scenario.DEFAULT_OWNER_EMAIL,
            help="workspace owner account used as the test admin (default: %s)" % scenario.DEFAULT_OWNER_EMAIL,
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="delete the accounts and records created by this fixture first",
        )
        parser.add_argument(
            "--wipe",
            action="store_true",
            help="delete every research record of the workspace (needs --yes)",
        )
        parser.add_argument("--yes", action="store_true", help="confirm --wipe / --reset")
        parser.add_argument(
            "--no-files",
            action="store_true",
            help="skip the MinIO uploads (attachment and snapshot metadata only)",
        )
        parser.add_argument(
            "--verify",
            action="store_true",
            help="print the ACL matrix, the pending work queues and the gate results",
        )
        parser.add_argument(
            "--quiet",
            action="store_true",
            help="only print the summary lines",
        )

    def handle(self, *args: Any, **options: Any):
        workspace = self._workspace(options["workspace"])
        owner = self._owner(workspace, options["owner_email"])

        if options["wipe"]:
            counts = wipe_research_data(workspace)
            self.stdout.write(self.style.WARNING("--wipe would delete:"))
            for key, value in sorted(counts.items()):
                self.stdout.write(f"  {key:<20} {value}")
            self.stdout.write("  research_audit_events are append-only and are never deleted")
            if not options["yes"]:
                self.stdout.write(self.style.WARNING("dry run only: re-run with --wipe --yes to delete"))
                return
            deleted = perform_wipe(workspace)
            for key, value in sorted(deleted.items()):
                self.stdout.write(f"  deleted {key:<20} {value}")
            self.stdout.write(self.style.SUCCESS("workspace research data wiped"))

        if options["reset"]:
            deleted = reset_seed(workspace)
            for key, value in sorted(deleted.items()):
                self.stdout.write(f"  removed {key:<20} {value}")
            self.stdout.write(self.style.SUCCESS("previously seeded fixture removed"))

        if options["wipe"] and options["yes"] and not options["reset"]:
            self.stdout.write("skipping the seed after --wipe; run again without --wipe")
            return

        builder = ResearchSeedBuilder(
            workspace,
            owner,
            with_files=not options["no_files"],
            log=None if options["quiet"] else self.stdout.write,
        )
        created = builder.run()

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("research fixture ready"))
        for key, value in sorted(created.items()):
            self.stdout.write(f"  created {key:<24} {value}")
        for warning in builder.file_warnings:
            self.stdout.write(self.style.WARNING(f"  file upload skipped: {warning}"))
        self.stdout.write(f"  seeded projects          {seeded_projects(workspace).count()}")
        self._print_accounts(workspace)

        if options["verify"]:
            result = verify(workspace)
            self.stdout.write("")
            self.stdout.write("ACL matrix (rows: viewer, columns: visibility level)")
            self.stdout.write(format_matrix(result["matrix"]))
            self.stdout.write(
                f"  fangyikai sees {result['visible_reports']} reports, "
                f"{result['pending_reviews']} pending stage reviews, "
                f"{result['pending_approvals']} pending approvals"
            )
            if result["midterm_gate"]:
                blockers = [item["code"] for item in result["midterm_gate"]["blockers"]]
                self.stdout.write(f"  midterm gate red items: {', '.join(blockers) or 'none'}")
            if result["opening_gate"]:
                blockers = [item["code"] for item in result["opening_gate"]["blockers"]]
                self.stdout.write(f"  opening gate red items: {', '.join(blockers) or 'none'}")
            if result["mismatches"]:
                for mismatch in result["mismatches"]:
                    self.stdout.write(
                        self.style.ERROR(
                            "  matrix mismatch: {visibility} x {subject} expected {expected} got {actual}".format(
                                **mismatch
                            )
                        )
                    )
            if not result["ok"]:
                raise CommandError("research fixture verification failed")
            self.stdout.write(self.style.SUCCESS("verification passed"))

    # -- helpers -----------------------------------------------------------

    def _workspace(self, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            raise CommandError(f"workspace '{slug}' does not exist")
        return workspace

    def _owner(self, workspace, email):
        user = None
        if email:
            user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is None:
            user = workspace.owner
        if user is None:
            member = (
                WorkspaceMember.objects.filter(workspace=workspace, role=WORKSPACE_ADMIN_ROLE, is_active=True)
                .select_related("member")
                .first()
            )
            user = member.member if member else None
        if user is None:
            raise CommandError("no workspace owner/admin account found")
        return user

    def _print_accounts(self, workspace):
        self.stdout.write("")
        self.stdout.write(f"accounts (password: {scenario.PASSWORD})")
        self.stdout.write(f"  {'email':<34}{'name':<10}identity")
        for spec in scenario.ACCOUNTS:
            self.stdout.write(f"  {spec.email:<34}{spec.display_name:<10}{spec.identity}")
        self.stdout.write(
            f"  {workspace.owner.email:<34}{workspace.owner.display_name:<10}"
            "工作区管理员 + 学院主 PI + 课题组主 PI + 评审/审批人"
        )
