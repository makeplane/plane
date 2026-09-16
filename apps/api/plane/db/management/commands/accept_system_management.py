# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Run the v2.4.0 acceptance walkthrough against the current deployment.

    python manage.py accept_system_management
    python manage.py accept_system_management --json

Every check drives the real API as the corresponding role of the seeded test
group. The command exits non-zero when a check fails, so it can be used as a
deployment gate.
"""

import json

from django.core.management.base import BaseCommand

from plane.research.seed.acceptance import AcceptanceRunner


class Command(BaseCommand):
    help = "Verify the two-workspace / admin tag / invite code / import baseline."

    def add_arguments(self, parser):
        parser.add_argument("--public-slug", default="public", help="public workspace slug")
        parser.add_argument("--pi-slug", default="pi", help="main PI workspace slug")
        parser.add_argument("--json", action="store_true", help="print the raw check payload")

    def handle(self, *args, **options):
        runner = AcceptanceRunner(
            public_slug=options["public_slug"],
            pi_slug=options["pi_slug"],
            log=self.stdout.write,
        )
        checks = runner.run()

        if options["json"]:
            self.stdout.write(
                json.dumps(
                    [
                        {
                            "key": check.key,
                            "title": check.title,
                            "status": check.status,
                            "detail": check.detail,
                            "steps": check.steps,
                        }
                        for check in checks
                    ],
                    ensure_ascii=False,
                    indent=2,
                )
            )

        passed = len([check for check in checks if check.status == "PASS"])
        failed = runner.failed
        self.stdout.write("")
        self.stdout.write(f"结论：{passed} / {len(checks)} 项通过")
        if failed:
            for check in failed:
                self.stdout.write(self.style.ERROR(f"  FAIL {check.title}: {check.detail}"))
            raise SystemExit(1)
        self.stdout.write(self.style.SUCCESS("全部验收项通过。"))
