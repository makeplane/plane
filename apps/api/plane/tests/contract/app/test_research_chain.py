# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Timeline and dual chain aggregation (P1-E1, P1-CHAIN-01 ~ P1-CHAIN-07)."""

from django.utils import timezone
import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    MATERIAL_TYPES_BY_STAGE,
    CodeArtifact,
    ExperimentRecord,
    ExternalReferenceLink,
    ExternalSystemConnection,
    LiteratureEntry,
    OrgUnit,
    OrgUnitMember,
    ProjectCodeRepository,
    ResearchExternalReference,
    ResearchOutcome,
    ResearchStageInstance,
    StageReview,
    StageTransition,
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
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)

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
    stages = owner and client_for(owner).get(
        f"/api/research/workspaces/{workspace.slug}/projects/{project_id}/stages/"
    ).json()["results"]
    return {
        "admin": admin,
        "owner": owner,
        "member": member,
        "workspace": workspace,
        "project_id": project_id,
        "group": group,
        "stages": stages,
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "member_client": client_for(member),
    }


def timeline_url(env, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/timeline/{suffix}"


def seed_project(env):
    """Create one object per timeline source."""
    pre = next(item for item in env["stages"] if item["stage"] == "PRE_OPENING")
    instance = ResearchStageInstance.objects.get(pk=pre["id"])
    instance.status = "SUBMITTED"
    instance.save(update_fields=["status"])
    StageTransition.objects.create(
        stage_instance=instance,
        actor=env["owner"],
        action="SUBMIT",
        from_status="IN_PROGRESS",
        to_status="SUBMITTED",
    )
    StageReview.objects.create(
        stage_instance=instance,
        reviewer=env["admin"],
        reviewer_role="REVIEWER",
        recommendation="PASS",
        submitted_at=timezone.now(),
        created_by=env["admin"],
    )
    LiteratureEntry.objects.create(
        workspace=env["workspace"],
        project_id=env["project_id"],
        owner=env["owner"],
        title="Included paper",
        status="INCLUDED",
        summary="s",
        gap_notes="g",
    )
    LiteratureEntry.objects.create(
        workspace=env["workspace"],
        project_id=env["project_id"],
        owner=env["owner"],
        title="Excluded paper",
        status="EXCLUDED",
    )
    ExperimentRecord.objects.create(
        workspace=env["workspace"],
        project_id=env["project_id"],
        sequence_no=1,
        title="Finished run",
        status="COMPLETED",
        owner=env["owner"],
        completed_at=timezone.now(),
    )
    repository = ProjectCodeRepository.objects.create(
        workspace=env["workspace"],
        project_id=env["project_id"],
        provider="GITHUB",
        repository_url="https://github.com/example/chain",
        created_by=env["owner"],
    )
    CodeArtifact.objects.create(
        repository=repository,
        ref_type="COMMIT",
        ref_value="abc1234",
        committed_at=timezone.now(),
        created_by=env["owner"],
    )
    ResearchOutcome.objects.create(
        workspace=env["workspace"],
        project_id=env["project_id"],
        output_type="PAPER",
        title="Final paper",
        status="PUBLISHED",
        created_by=env["owner"],
    )
    return instance


@pytest.mark.django_db
class TestTimeline:
    def test_timeline_orders_the_key_events(self, env):
        seed_project(env)
        payload = env["owner_client"].get(timeline_url(env)).json()
        kinds = [item["kind"] for item in payload["items"]]
        assert "literature" in kinds
        assert "stage_transition" in kinds
        assert "stage_review" in kinds
        assert "experiment" in kinds
        assert "code_artifact" in kinds
        assert "outcome" in kinds
        # reading order: cognition before production (P1-CHAIN-02)
        assert kinds.index("literature") < kinds.index("stage_transition")
        assert kinds.index("stage_review") < kinds.index("experiment")
        assert kinds.index("experiment") < kinds.index("code_artifact")
        assert kinds.index("code_artifact") < kinds.index("outcome")
        assert payload["stage_sequence"] == ["PRE_OPENING", "OPENING", "MIDTERM", "FINAL"]

    def test_only_included_literature_is_listed(self, env):
        seed_project(env)
        payload = env["owner_client"].get(timeline_url(env)).json()
        titles = [item["title"] for item in payload["items"] if item["kind"] == "literature"]
        assert titles == ["Included paper"]

    def test_items_can_be_filtered_by_chain_and_source(self, env):
        seed_project(env)
        thinking = env["owner_client"].get(f"{timeline_url(env)}?chain=thinking").json()
        assert {item["kind"] for item in thinking["items"]} <= {
            "literature",
            "stage_transition",
            "stage_review",
            "report",
        }
        development = env["owner_client"].get(f"{timeline_url(env)}?chain=development").json()
        assert "experiment" in {item["kind"] for item in development["items"]}
        assert "literature" not in {item["kind"] for item in development["items"]}

        filtered = env["owner_client"].get(f"{timeline_url(env)}?stage=PRE_OPENING").json()
        assert all(
            item.get("stage") in (None, "PRE_OPENING")
            for item in filtered["items"]
            if item["kind"] in ("stage_transition", "stage_review")
        )

    def test_invalid_chain_is_rejected(self, env):
        response = env["owner_client"].get(f"{timeline_url(env)}?chain=unknown")
        assert response.status_code == 400
        assert response.json()["error_code"] == "research_chain_invalid"

    def test_timeline_never_shows_objects_the_caller_cannot_read(self, env):
        ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Private run",
            status="COMPLETED",
            owner=env["owner"],
            visibility="PRIVATE",
        )
        payload = env["member_client"].get(timeline_url(env)).json()
        assert not [item for item in payload["items"] if "Private run" in item["title"]]
        owner_payload = env["owner_client"].get(timeline_url(env)).json()
        assert [item for item in owner_payload["items"] if "Private run" in item["title"]]

    def test_linked_external_references_move_the_degraded_flag(self, env):
        ExternalSystemConnection.objects.create(
            workspace=env["workspace"],
            system="RAGPORTAL",
            display_name="RAGPortal",
            base_url="https://ragportal.example.com",
            auth_mode="NONE",
            is_enabled=True,
        )
        reference = ResearchExternalReference.objects.create(
            workspace=env["workspace"],
            system="RAGPORTAL",
            external_type="KNOWLEDGE_ENTRY",
            external_id="kb-1",
            title="Handbook",
            source_url="https://ragportal.example.com/entries/kb-1",
            acl_hint={"public": True},
            status="DEGRADED",
            synced_at=timezone.now(),
            created_by=env["owner"],
        )
        ExternalReferenceLink.objects.create(
            reference=reference,
            target_type="PROJECT",
            target_id=env["project_id"],
            created_by=env["owner"],
        )
        payload = env["owner_client"].get(timeline_url(env)).json()
        node = next(item for item in payload["items"] if item["kind"] == "external_reference")
        assert node["degraded"] is True
        assert node["source_system"] == "RAGPORTAL"
        assert payload["degraded_sources"] == ["RAGPORTAL"]

    def test_unlinked_external_references_stay_out_of_the_timeline(self, env):
        ResearchExternalReference.objects.create(
            workspace=env["workspace"],
            system="SPECLABOS",
            external_type="RUN_RECORD",
            external_id="run-1",
            title="Unrelated run",
            source_url="https://speclabos.example.com/runs/1",
            acl_hint={"public": True},
            created_by=env["owner"],
        )
        payload = env["owner_client"].get(timeline_url(env)).json()
        assert not [item for item in payload["items"] if item["title"] == "Unrelated run"]


@pytest.mark.django_db
class TestChainViews:
    def test_chain_groups_split_the_timeline(self, env):
        seed_project(env)
        payload = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/chain/"
        ).json()
        assert set(payload["groups"]) == {"thinking", "development"}
        thinking_kinds = {item["kind"] for item in payload["groups"]["thinking"]}
        development_kinds = {item["kind"] for item in payload["groups"]["development"]}
        assert "stage_transition" in thinking_kinds
        assert "experiment" in development_kinds
        assert "literature" in thinking_kinds

    def test_export_matches_the_page_contents(self, env):
        seed_project(env)
        response = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/chain/export/"
        )
        assert response.status_code == 200
        body = response.content.decode("utf-8")
        assert "Finished run" in body
        assert "Final paper" in body
        assert "Included paper" in body

        thinking_only = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/chain/export/?chain=thinking"
        ).content.decode("utf-8")
        assert "Included paper" in thinking_only
        assert "Finished run" not in thinking_only
