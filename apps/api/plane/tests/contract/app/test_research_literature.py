# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Literature contract tests (P1-LIT-01 ~ P1-LIT-12)."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    LiteratureEntry,
    OrgUnit,
    OrgUnitMember,
    WorkspaceResearchSetting,
)
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    add_workspace_member(workspace, owner)
    stranger = make_user(first_name="Stranger")
    add_workspace_member(workspace, stranger)

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
    group = OrgUnit.objects.create(
        workspace=workspace,
        name="Group",
        parent=root,
        unit_type=OrgUnit.UnitType.GROUP,
        depth=1,
        path="",
    )
    group.path = f"{root.path}{str(group.id).replace('-', '')}/"
    group.save(update_fields=["path"])
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=owner, org_role=OrgUnitMember.OrgRole.PI
    )

    admin_client = client_for(admin)
    created = admin_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"owner": str(owner.id), "org_unit": str(group.id), "research_type": "PHD"},
        format="json",
    )
    project_id = created.json()["id"]
    return {
        "admin": admin,
        "owner": owner,
        "stranger": stranger,
        "workspace": workspace,
        "group": group,
        "project_id": project_id,
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "stranger_client": client_for(stranger),
    }


def literature_url(env, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/literature/{suffix}"


def entry_url(env, entry_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/literature/{entry_id}/{suffix}"


def create_entry(env, index, **overrides):
    payload = {
        "title": f"Paper {index}",
        "authors": "Smith, A.",
        "year": 2024,
        "venue": "Journal of Testing",
        "doi": f"10.1000/test{index}",
        "summary": "A summary.",
        "gap_notes": "A gap.",
        "status": "INCLUDED",
        "method_tags": ["DFT"],
        "system_tags": ["polymer"],
    }
    payload.update(overrides)
    return env["owner_client"].post(literature_url(env), payload, format="json")


@pytest.mark.django_db
class TestLiteratureCrud:
    def test_create_and_read_an_entry(self, env):
        created = create_entry(env, 1)
        assert created.status_code == 201, created.json()
        body = created.json()
        assert body["status"] == "INCLUDED"
        assert body["is_annotated"] is True
        assert body["has_verifiable_source"] is True
        assert body["method_tags"] == ["DFT"]

        listed = env["owner_client"].get(literature_url(env)).json()
        assert listed["count"] == 1
        assert listed["counters"]["included"] == 1
        assert listed["threshold"]["min_included"] == 20

        detail = env["owner_client"].get(entry_url(env, body["id"]))
        assert detail.status_code == 200

    def test_duplicate_doi_is_rejected(self, env):
        assert create_entry(env, 1).status_code == 201
        duplicate = create_entry(env, 2, doi="10.1000/test1")
        assert duplicate.status_code == 409
        assert duplicate.json()["error_code"] == "literature_duplicate_doi"

    def test_included_entry_requires_summary_and_gap_notes(self, env):
        missing = create_entry(env, 1, summary="", gap_notes="")
        assert missing.status_code == 422
        assert missing.json()["error_code"] == "literature_not_annotated"

        # a collected entry may be created without notes, but cannot be included
        collected = create_entry(env, 2, status="COLLECTED", summary="", gap_notes="")
        assert collected.status_code == 201
        promoted = env["owner_client"].post(
            entry_url(env, collected.json()["id"], "status/"), {"status": "INCLUDED"}, format="json"
        )
        assert promoted.status_code == 422
        assert promoted.json()["error_code"] == "literature_not_annotated"

        with_notes = env["owner_client"].post(
            entry_url(env, collected.json()["id"], "status/"),
            {"status": "INCLUDED", "summary": "sum", "gap_notes": "gap"},
            format="json",
        )
        assert with_notes.status_code == 200
        assert with_notes.json()["entry"]["status"] == "INCLUDED"
        assert with_notes.json()["counters"]["included"] == 1

    def test_update_moves_the_counters(self, env):
        created = create_entry(env, 1, status="COLLECTED", summary="", gap_notes="")
        entry_id = created.json()["id"]
        updated = env["owner_client"].patch(
            entry_url(env, entry_id),
            {"summary": "now annotated", "gap_notes": "and a gap"},
            format="json",
        )
        assert updated.status_code == 200
        excluded = env["owner_client"].post(
            entry_url(env, entry_id, "status/"), {"status": "EXCLUDED"}, format="json"
        )
        assert excluded.status_code == 200
        assert excluded.json()["counters"]["included"] == 0
        assert excluded.json()["counters"]["excluded"] == 1

    def test_delete_is_soft(self, env):
        created = create_entry(env, 1)
        entry_id = created.json()["id"]
        assert env["owner_client"].delete(entry_url(env, entry_id)).status_code == 204
        assert env["owner_client"].get(entry_url(env, entry_id)).status_code == 404
        assert LiteratureEntry.all_objects.get(pk=entry_id).deleted_at is not None

    def test_registration_limit_returns_422(self, env):
        setting = WorkspaceResearchSetting.objects.get(workspace=env["workspace"])
        setting.literature_max_entries = 2
        setting.save(update_fields=["literature_max_entries"])
        assert create_entry(env, 1).status_code == 201
        assert create_entry(env, 2).status_code == 201
        blocked = create_entry(env, 3)
        assert blocked.status_code == 422
        assert blocked.json()["error_code"] == "literature_limit_exceeded"

    def test_threshold_endpoint_reports_the_gap(self, env):
        create_entry(env, 1)
        payload = env["owner_client"].get(literature_url(env, "threshold/")).json()
        assert payload["counters"]["included"] == 1
        assert payload["remaining"] == 19
        assert payload["capacity"] == 99

    def test_unrelated_member_cannot_read_an_entry(self, env):
        created = create_entry(env, 1)
        entry_id = created.json()["id"]
        assert env["stranger_client"].get(entry_url(env, entry_id)).status_code == 404
        assert env["stranger_client"].get(literature_url(env)).json()["count"] == 0


@pytest.mark.django_db
class TestLiteratureImport:
    def test_doi_import_reports_each_row(self, env):
        assert create_entry(env, 1, doi="10.1000/dup").status_code == 201
        response = env["owner_client"].post(
            literature_url(env, "import/"),
            {"format": "doi", "content": "10.1000/dup\nhttps://doi.org/10.1000/fresh | Fresh paper"},
            format="json",
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body["created"]) == 1
        assert body["skipped"] == [{"doi": "10.1000/dup", "reason": "duplicate"}]
        assert body["counters"]["total"] == 2

    def test_bibtex_import_keeps_the_metadata(self, env):
        bibtex = """
        @article{key1,
          title = {Imported paper},
          author = {Doe, J.},
          journal = {Testing Today},
          year = {2021},
          doi = {10.1000/imported}
        }
        """
        response = env["owner_client"].post(
            literature_url(env, "import/"), {"format": "bibtex", "content": bibtex}, format="json"
        )
        assert response.status_code == 200
        entry = LiteratureEntry.objects.get(doi="10.1000/imported")
        assert entry.title == "Imported paper"
        assert entry.venue == "Testing Today"
        assert entry.year == 2021
        assert entry.status == "COLLECTED"

    def test_empty_import_is_rejected(self, env):
        response = env["owner_client"].post(
            literature_url(env, "import/"), {"format": "doi", "content": "  "}, format="json"
        )
        assert response.status_code == 422
        assert response.json()["error_code"] == "literature_import_empty"


@pytest.mark.django_db
class TestPreOpeningGate:
    def _prepare_materials_and_literature(self, env, included):
        stages = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/stages/"
        ).json()["results"]
        pre = next(item for item in stages if item["stage"] == "PRE_OPENING")
        assert env["owner_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/stages/{pre['id']}/enter/", {}, format="json"
        ).status_code == 200
        for material_type in MATERIAL_TYPES_BY_STAGE["PRE_OPENING"]:
            env["owner_client"].post(
                f"/api/research/workspaces/{env['workspace'].slug}/stages/{pre['id']}/materials/",
                {"material_type": material_type},
                format="json",
            )
        for index in range(included):
            assert create_entry(env, index).status_code == 201
        return pre["id"]

    def test_submission_is_blocked_below_the_literature_threshold(self, env):
        stage_id = self._prepare_materials_and_literature(env, 19)
        response = env["owner_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/stages/{stage_id}/submit/",
            {},
            format="json",
        )
        assert response.status_code == 422
        blocker = next(item for item in response.json()["blockers"] if item["code"] == "literature_min_included")
        assert blocker["actual"] == 19
        assert blocker["required"] == 20
        assert blocker["hint"]

    def test_submission_passes_at_the_threshold(self, env):
        stage_id = self._prepare_materials_and_literature(env, 20)
        response = env["owner_client"].post(
            f"/api/research/workspaces/{env['workspace'].slug}/stages/{stage_id}/submit/", {}, format="json"
        )
        assert response.status_code == 200, response.json()
        assert response.json()["status"] == "SUBMITTED"
