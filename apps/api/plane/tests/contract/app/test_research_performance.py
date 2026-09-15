# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Performance guardrails for the aggregation endpoints (P1-E2).

The budgets are deliberately generous: they catch a回归 into an N+1 query or an
unbounded aggregation, not micro-optimisation.
"""

import time

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import (
    CodeArtifact,
    ExperimentRecord,
    LiteratureEntry,
    OrgUnit,
    OrgUnitMember,
    ProjectCodeRepository,
    ResearchOutcome,
    ResearchStageInstance,
    StageMaterial,
    StageTransition,
)
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
)

pytestmark = [pytest.mark.contract, pytest.mark.slow]

GATE_BUDGET_SECONDS = 2.0
TIMELINE_BUDGET_SECONDS = 5.0


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    add_workspace_member(workspace, owner)

    root = OrgUnit.objects.create(
        workspace=workspace,
        name=workspace.name,
        parent=None,
        unit_type=OrgUnit.UnitType.ROOT,
        depth=0,
        path="",
    )
    root.path = f"/{str(root.id).replace('-', '')}/"
    root.save(update_fields=["path"])
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=root, user=owner, org_role=OrgUnitMember.OrgRole.PI
    )
    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)
    created = admin_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"owner": str(owner.id), "org_unit": str(root.id), "research_type": "PHD"},
        format="json",
    )
    client = APIClient()
    client.force_authenticate(user=owner)
    project_id = created.json()["id"]
    stages = client.get(
        f"/api/research/workspaces/{workspace.slug}/projects/{project_id}/stages/"
    ).json()["results"]
    return {
        "workspace": workspace,
        "owner": owner,
        "project_id": project_id,
        "stages": stages,
        "client": client,
    }


def seed_large_project(env, *, experiments=120, literature=120):
    pre = next(item for item in env["stages"] if item["stage"] == "PRE_OPENING")
    instance = ResearchStageInstance.objects.get(pk=pre["id"])
    instance.status = "SUBMITTED"
    instance.save(update_fields=["status"])
    StageMaterial.objects.bulk_create(
        [
            StageMaterial(
                stage_instance=instance,
                material_type=code,
                owner=env["owner"],
                created_by=env["owner"],
            )
            for code in ("TOPIC_DESCRIPTION", "GAP_ANALYSIS")
        ]
    )
    StageTransition.objects.bulk_create(
        [
            StageTransition(
                stage_instance=instance,
                action="SUBMIT",
                from_status="IN_PROGRESS",
                to_status="SUBMITTED",
            )
            for _ in range(20)
        ]
    )
    ExperimentRecord.objects.bulk_create(
        [
            ExperimentRecord(
                workspace=env["workspace"],
                project_id=env["project_id"],
                sequence_no=index + 1,
                title=f"Run {index}",
                status="COMPLETED" if index % 2 else "RUNNING",
                owner=env["owner"],
                completed_at=timezone.now() if index % 2 else None,
                created_by=env["owner"],
            )
            for index in range(experiments)
        ]
    )
    LiteratureEntry.objects.bulk_create(
        [
            LiteratureEntry(
                workspace=env["workspace"],
                project_id=env["project_id"],
                owner=env["owner"],
                title=f"Paper {index}",
                status="INCLUDED",
                summary="s",
                gap_notes="g",
                doi=f"10.1000/perf{index}",
                venue="Journal",
                created_by=env["owner"],
            )
            for index in range(literature)
        ]
    )
    repository = ProjectCodeRepository.objects.create(
        workspace=env["workspace"],
        project_id=env["project_id"],
        provider="GITHUB",
        repository_url="https://github.com/example/perf",
        created_by=env["owner"],
    )
    CodeArtifact.objects.bulk_create(
        [
            CodeArtifact(
                repository=repository,
                ref_type="COMMIT",
                ref_value=f"{index:07x}",
                committed_at=timezone.now(),
                created_by=env["owner"],
            )
            for index in range(60)
        ]
    )
    ResearchOutcome.objects.create(
        workspace=env["workspace"],
        project_id=env["project_id"],
        output_type="PAPER",
        title="Perf paper",
        status="PUBLISHED",
        created_by=env["owner"],
    )
    return instance


@pytest.mark.django_db
def test_gate_and_timeline_stay_within_budget(env):
    instance = seed_large_project(env)
    started = time.monotonic()
    gate = env["client"].get(
        f"/api/research/workspaces/{env['workspace'].slug}/stages/{instance.id}/gate/"
    )
    gate_seconds = time.monotonic() - started
    assert gate.status_code == 200
    assert gate_seconds < GATE_BUDGET_SECONDS, f"gate took {gate_seconds:.2f}s"

    started = time.monotonic()
    timeline = env["client"].get(
        f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/timeline/"
    )
    timeline_seconds = time.monotonic() - started
    assert timeline.status_code == 200
    assert timeline.json()["count"] > 200
    assert timeline_seconds < TIMELINE_BUDGET_SECONDS, f"timeline took {timeline_seconds:.2f}s"


@pytest.mark.django_db
def test_progress_aggregation_stays_within_budget(env):
    seed_large_project(env)
    started = time.monotonic()
    response = env["client"].get(
        f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/progress/"
    )
    seconds = time.monotonic() - started
    assert response.status_code == 200
    assert response.json()["experiments"]["total"] == 120
    assert seconds < TIMELINE_BUDGET_SECONDS, f"progress took {seconds:.2f}s"
