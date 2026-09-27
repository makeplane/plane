# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Benchmark the Team Operations Dashboard endpoints at spec §12 acceptance size.

Seeds 10k issues / 20 projects / 50 members, then measures cold/warm
latency, SQL query count, and payload size for every dashboard endpoint.
Output written to ``/tmp/plane-dashboard-bench.json`` so the
coordinator/frontend can read the metrics.

Spec acceptance target: warm p95 ≤ 1.5s, cold ≤ 3s. The test asserts
both targets so a regression that breaches them fails CI.

Run::

    docker compose -p plane-dashboard-ops-test -f docker-compose-test.yml \
        run --rm api-tests pytest plane/tests/perf/test_dashboard_bench.py -s
"""

from __future__ import annotations

import gc
import json
import statistics
import time as _time_module
from datetime import datetime, time, timedelta, timezone

import pytest
from django.db import connection, reset_queries
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from plane.db.models import (
    Issue, IssueAssignee, Project, ProjectMember, ProjectNetwork,
    State, User, Workspace, WorkspaceMember,
)


@pytest.mark.django_db(transaction=True)
class TestDashboardBenchmark:
    """Cold + warm latency, query count, payload size at 10k/20p/50m."""

    WARMUP = 3
    ITERATIONS = 16
    # Targets from the brief: warm p95 ≤ 1.5 s, cold ≤ 3 s.
    TARGET_WARM_P95_MS = 1500.0
    TARGET_COLD_MS = 3000.0
    OUTPUT = "/tmp/plane-dashboard-bench.json"

    def _persist(self, results):
        # Write to a directory that the host can mount for later
        # inspection, AND dump the JSON inline so the host can capture
        # it from the pytest output even if the volume mount is absent.
        try:
            with open(self.OUTPUT, "w") as fh:
                json.dump(results, fh, indent=2)
        except OSError:
            pass
        print("BENCH_JSON_BEGIN")
        print(json.dumps(results, indent=2, default=str))
        print("BENCH_JSON_END")

    def test_dashboard_endpoints_meet_spec_perf_targets(self):
        slug = "bench"
        workspace, owner = _seed_bench(slug)

        client = APIClient()
        client.force_authenticate(user=owner)
        endpoints = [
            ("overview", f"/api/workspaces/{slug}/dashboard/overview/"),
            ("workload", f"/api/workspaces/{slug}/dashboard/workload/"),
            ("projects", f"/api/workspaces/{slug}/dashboard/projects/"),
            ("timeline", f"/api/workspaces/{slug}/dashboard/timeline/"),
            ("attention", f"/api/workspaces/{slug}/dashboard/attention/"),
            ("items", f"/api/workspaces/{slug}/dashboard/items/"),
        ]

        results = {"workspace": slug, "endpoints": {}}
        # Per-endpoint warmup + measurement loop
        for label, path in endpoints:
            for _ in range(self.WARMUP):
                client.post(path, {}, format="json")
            cold, warm_lat, queries, sizes = [], [], [], []
            for i in range(self.ITERATIONS):
                if i == 0:
                    gc.collect()
                lat, q, sz = _measure(client, path)
                if i == 0:
                    cold.append(lat)
                else:
                    warm_lat.append(lat)
                queries.append(q)
                sizes.append(sz)
            stats = {
                "iterations": self.ITERATIONS,
                "warmup": self.WARMUP,
                "cold_ms": round(cold[0] * 1000, 2) if cold else None,
                "warm_p50_ms": round(statistics.median(warm_lat) * 1000, 2) if warm_lat else None,
                "warm_p95_ms": round(_percentile(warm_lat, 95) * 1000, 2) if warm_lat else None,
                "warm_p99_ms": round(_percentile(warm_lat, 99) * 1000, 2) if warm_lat else None,
                "queries_p50": int(statistics.median(queries)) if queries else None,
                "queries_p95": int(_percentile(queries, 95)) if queries else None,
                "payload_kb_p50": round(statistics.median(sizes) / 1024, 2) if sizes else None,
                "payload_kb_p95": round(_percentile(sizes, 95) / 1024, 2) if sizes else None,
            }
            results["endpoints"][label] = stats

        results["fixture"] = {
            "issues": Issue.objects.filter(workspace=workspace).count(),
            "projects": Project.objects.filter(workspace=workspace).count(),
            "members": User.objects.filter(member_workspace__workspace=workspace).count(),
        }

        with open(self.OUTPUT, "w") as fh:
            json.dump(results, fh, indent=2)
        self._persist(results)

        # Spec §12 acceptance: warm p95 ≤ 1.5s for every endpoint that
        # serves the overview/panel surface; cold ≤ 3s.
        for label, stats in results["endpoints"].items():
            warm_p95 = stats["warm_p95_ms"] or 0
            cold_ms = stats["cold_ms"] or 0
            print(
                f"BENCH {label:10s} cold={cold_ms:7.2f}ms "
                f"warm_p50={stats['warm_p50_ms']:7.2f}ms "
                f"warm_p95={warm_p95:7.2f}ms "
                f"queries_p50={stats['queries_p50']} "
                f"payload_p50={stats['payload_kb_p50']}KB"
            )
            assert warm_p95 <= self.TARGET_WARM_P95_MS, (
                f"{label}: warm p95 {warm_p95}ms > target {self.TARGET_WARM_P95_MS}ms"
            )
            assert cold_ms <= self.TARGET_COLD_MS, (
                f"{label}: cold {cold_ms}ms > target {self.TARGET_COLD_MS}ms"
            )


def _seed_bench(slug):
    """Drop and re-seed a 10k/20p/50m workspace."""
    from django.db import transaction

    with transaction.atomic():
        Workspace.objects.filter(slug=slug).delete()
        User.objects.filter(email=f"bench-{slug}@plane.so").delete()
        owner = User.objects.create(
            email=f"bench-{slug}@plane.so", username=f"bench-{slug}",
            is_active=True, is_superuser=False, is_staff=False,
        )
        owner.set_password("benchpw")
        owner.save()
        workspace = Workspace.objects.create(
            name="Bench", slug=slug, owner=owner, timezone="UTC",
            created_by=owner,
        )
        WorkspaceMember.objects.create(
            workspace=workspace, member=owner, role=20, is_active=True,
        )
        members = [owner]
        for i in range(49):
            u = User.objects.create(
                email=f"bench-{slug}-{i}@plane.so",
                username=f"bench-{slug}-{i}",
                is_active=True, is_superuser=False, is_staff=False,
            )
            u.set_password("benchpw")
            u.save()
            WorkspaceMember.objects.create(
                workspace=workspace, member=u, role=15, is_active=True,
            )
            members.append(u)

        projects = []
        for p in range(20):
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

        # 10k issues, 500 per project.
        today = datetime.now(timezone.utc).date()
        bulk = []
        for proj in projects:
            for i in range(500):
                group = (
                    "started" if i % 3 == 0
                    else "backlog" if i % 2 == 0
                    else "completed"
                )
                bulk.append(Issue(
                    project=proj, workspace=workspace,
                    name=f"{proj.identifier}-{i}",
                    state_id=State.objects.filter(project=proj, group=group)
                        .values_list("id", flat=True).first(),
                    priority="medium",
                    target_date=today + timedelta(days=(i % 14) - 5)
                    if group in ("started", "backlog") else None,
                    created_by=owner,
                ))
        Issue.objects.bulk_create(bulk, batch_size=500)

        # Assign first 5000 issues to members.
        ids = list(
            Issue.objects.filter(workspace=workspace).order_by("id")
            .values_list("id", flat=True)[:5000]
        )
        # Load the related Project objects once so bulk_create gets
        # Project instances, not bare UUIDs.
        from collections import defaultdict
        project_by_id = {p.id: p for p in projects}
        issue_to_project = dict(
            Issue.objects.filter(pk__in=ids).values_list("id", "project_id")
        )
        IssueAssignee.objects.bulk_create([
            IssueAssignee(
                issue_id=issue_id,
                assignee=members[idx % len(members)],
                project=project_by_id[issue_to_project[issue_id]],
                workspace=workspace,
            )
            for idx, issue_id in enumerate(ids)
        ], batch_size=500)
    return workspace, owner


def _measure(client, path):
    reset_queries()
    t0 = _time_module.perf_counter()
    with CaptureQueriesContext(connection) as ctx:
        resp = client.post(path, {}, format="json")
    elapsed = _time_module.perf_counter() - t0
    body = resp.content if hasattr(resp, "content") else b""
    return elapsed, len(ctx.captured_queries), len(body)


def _percentile(values, p):
    if not values:
        return 0
    s = sorted(values)
    k = (len(s) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[f]
    return s[f] + (s[c] - s[f]) * (k - f)
