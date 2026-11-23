# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import importlib
import sys
from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.core.management.commands import makemigrations
from django.db.migrations.loader import MigrationLoader

LOCKFILE = Path(settings.BASE_DIR).parent / "migrations_lockfile.txt"

HEADER = """\
# Latest migration of every Plane app. `python manage.py makemigrations` rewrites
# this file; never edit it by hand.
#
# A merge conflict here means another PR added a migration to the same app first:
# merge preview, delete your migration, and run makemigrations again.
"""


def render(leaves):
    # A blank line between apps: git conflicts on adjacent lines, so two PRs
    # adding migrations to different apps would otherwise conflict.
    return HEADER + "\n" + "\n\n".join(f"{app}: {name}" for app, name in sorted(leaves.items())) + "\n"


def parse(text):
    return dict(line.split(": ", 1) for line in text.splitlines() if ": " in line and not line.startswith("#"))


def mismatches(locked, leaves):
    return [
        f"{app}: lockfile has {locked.get(app, 'nothing')}, graph has {leaves.get(app, 'nothing')}"
        for app in sorted(locked.keys() | leaves.keys())
        if locked.get(app) != leaves.get(app)
    ]


def plane_leaves():
    # makemigrations may have just written a migration file in this process.
    importlib.invalidate_caches()
    graph = MigrationLoader(None, ignore_no_migrations=True).graph
    return {app: name for app, name in graph.leaf_nodes() if apps.get_app_config(app).name.startswith("plane.")}


class Command(makemigrations.Command):
    """Django's makemigrations, plus the migrations lockfile.

    Two PRs that add a migration to the same app both change that app's line in
    the lockfile, so the second one to merge gets a git conflict.
    """

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--lockfile-warn-only",
            action="store_true",
            help="With --check, report a lockfile that does not match the migration graph without failing.",
        )

    def handle(self, *app_labels, **options):
        super().handle(*app_labels, **options)
        leaves = plane_leaves()
        if options["check_changes"]:
            self.check_lockfile(leaves, warn_only=options["lockfile_warn_only"])
        elif not options["dry_run"]:
            LOCKFILE.write_text(render(leaves))

    def check_lockfile(self, leaves, warn_only):
        text = LOCKFILE.read_text() if LOCKFILE.exists() else ""
        if "<<<<<<<" in text:
            problems = ["it has unresolved merge conflict markers; resolve them as its header says"]
        else:
            problems = mismatches(parse(text), leaves)
        if not problems:
            return
        self.stderr.write(
            f"{LOCKFILE.name} does not match the migration graph:\n  "
            + "\n  ".join(problems)
            + "\nRun `python manage.py makemigrations` and commit the lockfile."
        )
        if not warn_only:
            sys.exit(2)
