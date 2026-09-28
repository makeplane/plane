# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Benchmark the Team Operations Dashboard at the spec §12 acceptance size.

Runs against the local test DB (or QA DB via the QA API). Seeds 10k
issues, 20 projects, 50 members, then measures:

* cold vs warm latency for /overview/ (p50/p95/p99)
* SQL query count per request
* response payload size (KB)
* same for /workload/, /projects/, /timeline/, /items/, /attention/

Usage:
    python manage.py benchmark_dashboard --output /tmp/bench.json
    python manage.py benchmark_dashboard --issues 10000 --projects 20 --members 50
    python manage.py benchmark_dashboard --use-existing  # benchmark without reseeding
"""

from __future__ import annotations

import gc
import json
import statistics
import time
from contextlib import contextmanager
from datetime import datetime, time, timedelta, timezone

from django.core.management.base import BaseCommand
from django.db import connection, reset_queries
from django.test import Client
from django.test.utils import CaptureQueriesContext

from plane.analytics.dashboard import resolve_dashboard_scope
from plane.db.models import (
    Issue, IssueAssignee, Label, Project, ProjectMember,
    ProjectNetwork, State, User, Workspace, WorkspaceMember,
)


class Command(BaseCommand):
    help = "Benchmark the Dashboard endpoints at 10k issues / 20p / 50m."

    def add_arguments(self, parser):
        parser.add_argument("--issues", type=int, default=10_000)
        parser.add_argument("--projects", type=int, default=20)
        parser.add_argument("--members", type=int, default=50)
        parser.add_argument(
            "--use-existing",
            action="store_true",
            help="Skip seeding; benchmark whatever is already in the DB.",
        )
        parser.add_argument("--warmup", type=int, default=2)
        parser.add_argument("--iterations", type=int, default=20)
        parser.add_argument("--output", default="/tmp/plane-dashboard-bench.json")
        parser.add_argument(
            "--workspace-slug", default="bench",
            help="Workspace slug to (re)create for the benchmark.",
        )

    def handle(self, *args, **options):
        n_issues = options["issues"]
        n_projects = options["projects"]
        n_members = options["members"]
        warmup = options["warmup"]
        iters = options["iterations"]
        out = options["output"]
        slug = options["workspace_slug"]

        if not options["use_existing"]:
            self._seed(slug, n_members, n_projects, n_issues)

        workspace = Workspace.objects.get(slug=slug)
        owner = workspace.owner

        client = Client()
        client.force_login(owner)
        endpoints = [
            ("overview", f"/api/workspaces/{slug}/dashboard/overview/"),
            ("workload", f"/api/workspaces/{slug}/dashboard/workload/"),
            ("projects", f"/api/workspaces/{slug}/dashboard/projects/"),
            ("timeline", f"/api/workspaces/{slug}/dashboard/timeline/"),
            ("attention", f"/api/workspaces/{slug}/dashboard/attention/"),
            ("items", f"/api/workspaces/{slug}/dashboard/items/"),
        ]

        results = {"workspace": slug, "endpoints": {}}
        for label, path in endpoints:
            # Warmup runs (populate caches / first-query JIT).
            for _ in range(warmup):
                client.post(path, {}, content_type="application/json")
            cold_latencies = []
            warm_latencies = []
            queries = []
            payload_sizes = []
            for i in range(iters):
                if i == 0:
                    gc.collect()  # cold = nothing in connection cache
                lat, q, sz = self._measure(client, path)
                if i == 0:
                    cold_latencies.append(lat)
                else:
                    warm_latencies.append(lat)
                queries.append(q)
                payload_sizes.append(sz)
            stats = {
                "iterations": iters,
                "warmup": warmup,
                "cold_ms": round(cold_latencies[0] * 1000, 2) if cold_latencies else None,
                "warm_p50_ms": round(statistics.median(warm_latencies) * 1000, 2) if warm_latencies else None,
                "warm_p95_ms": round(_percentile(warm_latencies, 95) * 1000, 2) if warm_latencies else None,
                "warm_p99_ms": round(_percentile(warm_latencies, 99) * 1000, 2) if warm_latencies else None,
                "queries_p50": int(statistics.median(queries)) if queries else None,
                "queries_p95": int(_percentile(queries, 95)) if queries else None,
                "payload_kb_p50": round(statistics.median(payload_sizes) / 1024, 2) if payload_sizes else None,
                "payload_kb_p95": round(_percentile(payload_sizes, 95) / 1024, 2) if payload_sizes else None,
            }
            results["endpoints"][label] = stats
            self.stdout.write(
                f"{label:10s} cold={stats['cold_ms']}ms warm_p50={stats['warm_p50_ms']}ms "
                f"warm_p95={stats['warm_p95_ms']}ms queries_p50={stats['queries_p50']} "
                f"payload_kb_p50={stats['payload_kb_p50']}"
            )
        results["fixture"] = {
            "issues": Issue.objects.filter(workspace=workspace).count(),
            "projects": Project.objects.filter(workspace=workspace).count(),
            "members": User.objects.filter(workspace_member__workspace=workspace).count(),
        }
        with open(out, "w") as fh:
            json.dump(results, fh, indent=2)
        self.stdout.write(self.style.SUCCESS(f"Wrote benchmark → {out}"))

    def _measure(self, client, path):
        # Force fresh connection so query count starts at 0.
        reset_queries()
        t0 = time.perf_counter()
        with CaptureQueriesContext(connection) as ctx:
            resp = client.post(path, {}, content_type="application/json")
        elapsed = time.perf_counter() - t0
        body = resp.content if hasattr(resp, "content") else b""
        return elapsed, len(ctx.captured_queries), len(body)

    def _seed(self, slug: str, n_members: int, n_projects: int, n_issues: int):
        Workspace.objects.filter(slug=slug).delete()
        User.objects.filter(email=f"bench-{slug}@plane.so").delete()
        owner = User.objects.create(
            email=f"bench-{slug}@plane.so", username=f"bench-{slug}",
            is_active=True, is_superuser=False, is_staff=False,
        )
        owner.set_password("benchpw"); owner.save()
        workspace = Workspace.objects.create(
            name="Bench", slug=slug, owner=owner, timezone="UTC",
            created_by=owner,
        )
        WorkspaceMember.objects.create(
            workspace=workspace, member=owner, role=20, is_active=True,
        )
        members = [owner]
        for i in range(n_members - 1):
            u = User.objects.create(
                email=f"bench-{slug}-{i}@plane.so",
                username=f"bench-{slug}-{i}",
                is_active=True, is_superuser=False, is_staff=False,
            )
            u.set_password("benchpw"); u.save()
            WorkspaceMember.objects.create(
                workspace=workspace, member=u, role=15, is_active=True,
            )
            members.append(u)

        projects = []
        for p in range(n_projects):
            proj = Project.objects.create(
                workspace=workspace, name=f"Project {p}",
                identifier=f"P{p:02d}",
                created_by=owner, updated_by=owner,
                network=ProjectNetwork.PUBLIC.value,
            )
            for u in members:
                ProjectMember.objects.create(
                    project=proj, member=u, role=20, is_active=True,
                )
            for group, name in [
                ("backlog", "Backlog"), ("unstarted", "Unstarted"),
                ("started", "Started"), ("completed", "Completed"),
                ("cancelled", "Cancelled"),
            ]:
                State.objects.create(
                    project=proj, name=name, color="#000000", group=group,
                )
            projects.append(proj)

        # Bulk-create issues via raw SQL for speed.
        today = datetime.now(timezone.utc).date()
        per_project = n_issues // n_projects
        bulk = []
        label_objects = []
        for proj in projects:
            for i in range(per_project):
                group = _pick_group(i)
                bulk.append(Issue(
                    project=proj, workspace=workspace,
                    name=f"{proj.identifier}-{i}",
                    state_id=_state_id(proj, group),
                    priority=("urgent" if i % 7 == 0 else "high" if i % 3 == 0 else "medium"),
                    target_date=(
                        today + timedelta(days=(i % 14) - 5)
                        if group in ("started", "backlog", "unstarted") else None
                    ),
                    created_by=owner,
                ))
        Issue.objects.bulk_create(bulk, batch_size=500)
        # Add assignees in bulk.
        issues = list(Issue.objects.filter(workspace=workspace).only("id")[:5000])
        assignee_bulk = []
        for i, issue in enumerate(issues):
            assignee_bulk.append(IssueAssignee(
                issue=issue, assignee=members[i % len(members)],
                project=issue.project, workspace=workspace,
            ))
        IssueAssignee.objects.bulk_create(assignee_bulk, batch_size=500)

    @staticmethod
    def _pick_group(i): return ("started" if i % 3 == 0 else "backlog" if i % 2 == 0 else "completed")


def _percentile(values, p):
    if not values:
        return 0
    sorted_values = sorted(values)
    k = (len(sorted_values) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_values) - 1)
    if f == c:
        return sorted_values[f]
    return sorted_values[f] + (sorted_values[c] - sorted_values[f]) * (k - f)


def _state_id(project, group):
    return State.objects.filter(project=project, group=group).values_list("id", flat=True).first()


# Override: real implementation is _pick_group inside Command
Command._pick_group = staticmethod(lambda i: ("started" if i % 3 == 0 else "backlog" if i % 2 == 0 else "completed"))
Command._state_id = staticmethod(_state_id)
