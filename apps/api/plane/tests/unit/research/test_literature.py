# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Literature counters, import parsing and the pre-opening gate (P1-B1)."""

import pytest

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    LiteratureEntry,
    Project,
    ProjectIdentifier,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageMaterial,
    StageType,
    WorkspaceResearchSetting,
)
from plane.research.services.stage_gate import SUBMIT_PHASE, evaluate_stage_gate
from plane.research.utils.literature import (
    literature_counters,
    literature_thresholds,
    parse_bibtex,
    parse_doi_lines,
)
from plane.tests.research_fixtures import enable_research, make_user, make_workspace

pytestmark = pytest.mark.unit

BIBTEX = """
@article{smith2024,
  title = {A study of polymer blends},
  author = {Smith, A. and Doe, B.},
  journal = {Journal of Polymers},
  year = {2024},
  doi = {10.1000/xyz123},
  abstract = {We study blends.}
}
@misc{internalnote,
  author = {Lab},
  year = {2023}
}
"""


@pytest.fixture
def literature_env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    project = Project.objects.create(workspace=workspace, name="Literature project", identifier="LIT", created_by=owner)
    ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace=workspace)
    ResearchProjectProfile.objects.create(project=project, workspace=workspace, owner=owner, created_by=owner)
    instance = ResearchStageInstance.objects.create(
        workspace=workspace,
        project=project,
        stage=StageType.PRE_OPENING.value,
        sort_order=1,
        status=ResearchStageInstance.Status.IN_PROGRESS,
        created_by=owner,
    )
    return {"workspace": workspace, "owner": owner, "project": project, "instance": instance, "db": db}


def test_parse_doi_lines_handles_prefixes_and_titles():
    parsed = parse_doi_lines("10.1000/abc\nhttps://doi.org/10.1000/def | Second paper\n\n")
    assert parsed[0]["doi"] == "10.1000/abc"
    assert parsed[0]["title"] == "10.1000/abc"
    assert parsed[1]["doi"] == "10.1000/def"
    assert parsed[1]["title"] == "Second paper"
    assert parsed[1]["url"] == "https://doi.org/10.1000/def"


def test_parse_bibtex_reads_fields_and_falls_back_to_the_key():
    parsed = parse_bibtex(BIBTEX)
    assert len(parsed) == 2
    assert parsed[0]["title"] == "A study of polymer blends"
    assert parsed[0]["venue"] == "Journal of Polymers"
    assert parsed[0]["doi"] == "10.1000/xyz123"
    assert parsed[0]["year"] == 2024
    assert parsed[0]["summary"] == "We study blends."
    # an entry without a title is importable but clearly marked
    assert parsed[1]["title"] == "internalnote"
    assert parsed[1]["year"] == 2023


def test_parse_bibtex_ignores_empty_input():
    assert parse_bibtex("") == []
    assert parse_doi_lines("") == []


def make_entry(env, *, status, index, summary="summary", gap_notes="gap", doi=None, venue="Journal"):
    return LiteratureEntry.objects.create(
        workspace=env["workspace"],
        project=env["project"],
        owner=env["owner"],
        title=f"Paper {index}",
        year=2020 + (index % 5),
        venue=venue,
        doi=doi if doi is not None else f"10.1000/{index}",
        summary=summary,
        gap_notes=gap_notes,
        status=status,
    )


@pytest.mark.django_db
def test_thresholds_come_from_the_workspace_settings(literature_env):
    assert literature_thresholds(literature_env["workspace"]) == {"min_included": 20, "max_entries": 100}
    setting = WorkspaceResearchSetting.objects.get(workspace=literature_env["workspace"])
    setting.literature_min_included = 5
    setting.literature_max_entries = 7
    setting.save(update_fields=["literature_min_included", "literature_max_entries"])
    assert literature_thresholds(literature_env["workspace"]) == {"min_included": 5, "max_entries": 7}


@pytest.mark.django_db
def test_counters_split_by_status_and_quality(literature_env):
    make_entry(literature_env, status="INCLUDED", index=1)
    make_entry(literature_env, status="INCLUDED", index=2, summary="", gap_notes="")
    make_entry(literature_env, status="COLLECTED", index=3)
    make_entry(literature_env, status="EXCLUDED", index=4)
    counters = literature_counters(literature_env["project"].id, literature_env["workspace"].id)
    assert counters["total"] == 4
    assert counters["included"] == 2
    assert counters["collected"] == 1
    assert counters["excluded"] == 1
    assert counters["unannotated_count"] == 1
    assert counters["unverifiable_count"] == 0


@pytest.mark.django_db
def test_unverifiable_sources_are_counted(literature_env):
    make_entry(literature_env, status="INCLUDED", index=1, doi="", venue="")
    counters = literature_counters(literature_env["project"].id, literature_env["workspace"].id)
    assert counters["unverifiable_count"] == 1


@pytest.mark.django_db
def test_pre_opening_gate_blocks_below_the_threshold(literature_env):
    for material_type in MATERIAL_TYPES_BY_STAGE["PRE_OPENING"]:
        StageMaterial.objects.create(
            stage_instance=literature_env["instance"],
            material_type=material_type,
            owner=literature_env["owner"],
        )
    for index in range(19):
        make_entry(literature_env, status="INCLUDED", index=index)

    gate = evaluate_stage_gate(literature_env["instance"], SUBMIT_PHASE)
    assert gate["result"] == "BLOCKED"
    blocker = next(item for item in gate["blockers"] if item["code"] == "literature_min_included")
    assert blocker["required"] == 20
    assert blocker["actual"] == 19
    assert blocker["hint"]

    make_entry(literature_env, status="INCLUDED", index=99)
    satisfied = evaluate_stage_gate(literature_env["instance"], SUBMIT_PHASE)
    assert satisfied["result"] == "PASS"
    assert satisfied["rule_version"]


@pytest.mark.django_db
def test_pre_opening_gate_blocks_unannotated_included_entries(literature_env):
    for material_type in MATERIAL_TYPES_BY_STAGE["PRE_OPENING"]:
        StageMaterial.objects.create(
            stage_instance=literature_env["instance"],
            material_type=material_type,
            owner=literature_env["owner"],
        )
    for index in range(19):
        make_entry(literature_env, status="INCLUDED", index=index)
    make_entry(literature_env, status="INCLUDED", index=50, summary="", gap_notes="")

    gate = evaluate_stage_gate(literature_env["instance"], SUBMIT_PHASE)
    codes = {item["code"] for item in gate["blockers"]}
    assert "literature_quality" in codes
    quality = next(item for item in gate["items"] if item["code"] == "literature_quality")
    assert quality["actual"] == 1
