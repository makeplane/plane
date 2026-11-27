# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Import of the decision register (plane/liviere/decisions/importer.py) on the sample file
# (data/decisions_sample.json: an invented tea shop, project DEMO).

import copy
import json
import time
from pathlib import Path
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember
from plane.db.models.api import APIToken
from plane.liviere.models import Decision, DecisionArea, DecisionEvent, DecisionIssue, DecisionSettings

SAMPLE = json.loads((Path(__file__).parent / "data" / "decisions_sample.json").read_text(encoding="utf-8"))


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Sklep", identifier="DEMO", workspace=workspace, created_by=create_user, timezone="Europe/Warsaw"
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    DecisionSettings.objects.create(project=project, enabled=True)
    # DEMO-1, DEMO-2, DEMO-3; DEMO-2 archived (closed work items are archived after a month)
    for name in ("Pierwszy", "Przeniesienie zamówień", "Regulamin zwrotów"):
        Issue.objects.create(project=project, workspace=workspace, name=name)
    Issue.all_objects.filter(project=project, sequence_id=2).update(archived_at=timezone.now())
    return project


@pytest.fixture
def key(create_user):
    token = APIToken.objects.create(user=create_user, label="import", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _url(project, commit=False):
    url = f"/api/v1/workspaces/{project.workspace.slug}/projects/{project.id}/liviere/decisions/import/"
    return url + ("?commit=1" if commit else "")


def _import(key, project, data, commit=False):
    return key.post(_url(project, commit), data, format="json")


def _codes(response):
    return [(e["number"], e["field"]) for e in response.json()["errors"]]


@pytest.mark.contract
class TestImport:
    @pytest.mark.django_db
    def test_dry_run_writes_nothing(self, key, project):
        response = _import(key, project, SAMPLE)
        assert response.status_code == 200, response.json()
        body = response.json()
        assert body["dry_run"] is True and body["errors"] == [] and body["warnings"] == []
        assert body["summary"] == {
            "decisions": 8,
            "by_status": {"superseded": 1, "active": 3, "deferred": 1, "done": 1, "proposed": 1, "revoked": 1},
            "areas_created": 3,
            "mechanisms_created": 3,
            "needs_review": 2,
            "issue_links": 2,
            "issues_not_found": 0,
        }
        assert body["sources"]["memory:project_returns_notes.md"] == [1, 2]
        assert body["last_number"] == 8
        assert (Decision.objects.count(), DecisionArea.objects.count(), DecisionEvent.objects.count()) == (0, 0, 0)
        assert DecisionSettings.objects.get(project=project).last_number == 0

    @pytest.mark.django_db
    def test_commit_keeps_the_values_of_the_file(self, key, project):
        response = _import(key, project, SAMPLE, commit=True)
        assert response.status_code == 201, response.json()
        assert Decision.objects.count() == 8
        assert DecisionSettings.objects.get(project=project).last_number == 8
        base = f"/api/v1/workspaces/{project.workspace.slug}/projects/{project.id}/liviere/decisions/"
        two = key.get(base + "2/").json()
        assert (two["supersedes"], two["decided_by"], two["confirmed"], two["decided_on"]) == (
            1,
            "user",
            True,
            "2026-10-10",
        )
        assert two["related"] == [3, 7]
        assert [i["identifier"] for i in two["issues"]] == ["DEMO-3"]
        one = key.get(base + "1/").json()
        assert (one["status"], one["superseded_by"], one["needs_review"], one["estimated"]) == (
            "superseded",
            [2],
            True,
            ["decided_on"],
        )
        three = key.get(base + "3/").json()
        assert (three["decided_by"], three["decided_on"], three["queues"]) == ("unknown", None, ["confirm", "imported"])
        # An archived work item links like any other
        five = key.get(base + "5/").json()
        assert five["issues"][0]["archived"] is True
        four = key.get(base + "4/").json()
        assert (four["area2"], four["review_condition"]) == (
            "zamowienia",
            "gdy liczba zwrotów przekroczy 20 miesięcznie",
        )
        assert not Decision.objects.filter(pending_rollout=True).exists()
        assert set(DecisionEvent.objects.values_list("kind", "channel")) == {("imported", "api")}
        assert DecisionEvent.objects.count() == 8
        # The next decision continues after the highest imported number
        created = key.post(base, {"title": "Nowa", "area": "praca", "kind": "process"}, format="json").json()
        assert created["number"] == 9
        # Queue "to review after import": nr 3 needs an author through the key
        response = key.post(base + "3/import-review/", {}, format="json")
        assert response.json()["code"] == "author_required"
        reviewed = key.post(base + "3/import-review/", {"decided_by": "user"}, format="json").json()
        assert (reviewed["needs_review"], reviewed["confirmed"], reviewed["queues"]) == (False, True, [])

    @pytest.mark.django_db
    def test_a_second_run_is_refused_with_the_collisions(self, key, project):
        assert _import(key, project, SAMPLE, commit=True).status_code == 201
        again = _import(key, project, SAMPLE, commit=True)
        assert again.status_code == 400
        assert again.json()["code"] == "import_rejected"
        assert _codes(again) == [(n, "number") for n in range(1, 9)]
        assert Decision.objects.count() == 8

    @pytest.mark.django_db
    def test_one_bad_decision_rejects_the_file(self, key, project):
        data = copy.deepcopy(SAMPLE)
        data["decisions"][4]["area"] = "magazyn"
        data["decisions"][5]["decided_on"] = "24.11.2026"
        data["decisions"][6]["status"] = "maybe"
        response = _import(key, project, data, commit=True)
        assert response.status_code == 400
        assert _codes(response) == [(5, "area"), (6, "decided_on"), (7, "status")]
        assert Decision.objects.count() == 0 and DecisionArea.objects.count() == 0

    @pytest.mark.django_db
    def test_checks_of_the_sample_builder(self, key, project):
        cases = [
            (lambda d: d["decisions"][1].update(supersedes=42), (2, "supersedes")),
            (lambda d: d["decisions"][0].update(status="active"), (2, "supersedes")),
            (lambda d: d["decisions"][2].update(needs_review=False), (3, "needs_review")),
            (lambda d: d["decisions"][1].update(mechanism="faktury"), (2, "mechanism")),
            (lambda d: d["decisions"][3].update(area2="platnosci"), (4, "area2")),
            (lambda d: d["decisions"][1].update(related=[99]), (2, "related")),
            (lambda d: d["decisions"][1].pop("sources"), (2, "sources")),
            (lambda d: d["decisions"][1].update(number=1), (1, "number")),
        ]
        for change, expected in cases:
            data = copy.deepcopy(SAMPLE)
            change(data)
            response = _import(key, project, data)
            assert response.status_code == 400, expected
            assert expected in _codes(response), (expected, response.json()["errors"])

    @pytest.mark.django_db
    def test_cycle_and_split(self, key, project):
        data = copy.deepcopy(SAMPLE)
        data["decisions"][0].update(supersedes=2)
        data["decisions"][1].update(status="superseded")
        response = _import(key, project, data)
        assert response.status_code == 400
        assert any(e["field"] == "supersedes" and "cycle" in e["error"] for e in response.json()["errors"])
        # Two successors of one decision (a split) are fine
        data = copy.deepcopy(SAMPLE)
        data["decisions"][2].update(supersedes=1)
        response = _import(key, project, data, commit=True)
        assert response.status_code == 201, response.json()
        assert sorted(Decision.objects.get(number=1).successors.values_list("number", flat=True)) == [2, 3]

    @pytest.mark.django_db
    def test_missing_work_item_is_a_warning_kept_in_sources(self, key, project):
        data = copy.deepcopy(SAMPLE)
        data["decisions"][4]["issues"] = ["DEMO-2", "DEMO-99"]
        data["decisions"][4]["pending_rollout"] = True
        data["project"] = "OTHER"
        dry = _import(key, project, data).json()
        assert {w["field"] for w in dry["warnings"]} == {"issues", "pending_rollout", "project"}
        assert dry["summary"]["issues_not_found"] == 1
        response = _import(key, project, data, commit=True)
        assert response.status_code == 201
        five = Decision.objects.get(number=5)
        assert five.sources[-1] == "ticket:DEMO-99 (not found)"
        assert five.pending_rollout is False
        assert DecisionIssue.objects.filter(decision=five).count() == 1

    @pytest.mark.django_db
    def test_existing_areas_are_kept(self, key, project):
        DecisionArea.objects.create(
            workspace=project.workspace, project=project, key="zamowienia", name="Sprzedaż", sort_order=5
        )
        body = _import(key, project, SAMPLE, commit=True).json()
        assert body["summary"]["areas_created"] == 2
        assert DecisionArea.objects.get(key="zamowienia", parent__isnull=True).name == "Sprzedaż"
        assert DecisionArea.objects.filter(parent__key="zamowienia").count() == 2

    @pytest.mark.django_db
    def test_250_decisions_in_one_request(self, key, project):
        data = copy.deepcopy(SAMPLE)
        template = SAMPLE["decisions"][1]
        data["decisions"] = [
            {
                **template,
                "number": n,
                "title": f"Zmyślona reguła {n}",
                "supersedes": None,
                "related": [n - 1] if n > 1 else [],
                "issues": ["DEMO-3"],
            }
            for n in range(1, 251)
        ]
        size = len(json.dumps(data, ensure_ascii=False).encode())
        started = time.monotonic()
        response = _import(key, project, data, commit=True)
        elapsed = time.monotonic() - started
        assert response.status_code == 201, response.json()
        assert Decision.objects.count() == 250
        print(f"\nimport of 250 decisions: {size // 1024} KB, {elapsed:.2f} s")
        assert size < 5 * 1024 * 1024
        assert elapsed < 30
