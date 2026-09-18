# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    ExperimentRecord,
    ExperimentRecordVersion,
    ExternalReferenceLink,
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    Page,
    PeriodicReport,
    Project,
    ProjectMember,
    ResearchAuditEvent,
    ResearchExternalReference,
    ResearchProjectProfile,
    ResearchStageInstance,
    StageMaterial,
    StageMaterialVersion,
)
from plane.tests.research_fixtures import add_workspace_member, enable_research, make_user, make_workspace

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


@pytest.fixture
def env(db):
    owner = make_user(first_name="Owner")
    workspace = make_workspace(owner)
    enable_research(workspace)
    root = OrgUnit.objects.create(
        workspace=workspace,
        name="课题组",
        unit_type=OrgUnit.UnitType.ROOT,
        path="/",
        depth=0,
    )
    root.path = f"/{str(root.id).replace('-', '')}/"
    root.save(update_fields=["path"])
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=root,
        user=owner,
        org_role=OrgUnitMember.OrgRole.REVIEWER,
        is_primary=True,
    )
    client = APIClient()
    client.force_authenticate(user=owner)
    project = client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"research_type": "PHD", "name": "个人培养"},
        format="json",
    ).json()
    return owner, workspace, project


def test_context_is_versioned_paginated_and_read_only(env):
    owner, workspace, project = env
    client = APIClient()
    client.force_authenticate(user=owner)
    before = workspace.research_project_profiles.count()

    response = client.get(f"/api/research/workspaces/{workspace.slug}/context/?project_id={project['id']}&page_size=10")

    assert response.status_code == 200
    assert response.data["schema_version"]
    assert response.data["scope"]["business_records_mutated"] is False
    assert response.data["pagination"]["page_size"] == 10
    assert any(item["kind"] == "project" for item in response.data["resources"])
    assert workspace.research_project_profiles.count() == before
    audit = ResearchAuditEvent.objects.get(action="context.read")
    assert "body" not in audit.metadata


def test_context_accepts_existing_api_tokens_without_expanding_scope(env):
    owner, workspace, project = env
    token = APIToken.objects.create(user=owner, workspace=workspace, label="agent-context")
    client = APIClient()

    response = client.get(
        f"/api/research/workspaces/{workspace.slug}/context/?project_id={project['id']}",
        HTTP_X_API_KEY=token.token,
    )

    assert response.status_code == 200
    assert response.data["scope"]["actor"] == str(owner.id)


def test_workspace_scoped_token_cannot_read_another_workspace(env):
    owner, workspace, _project = env
    other = make_workspace(owner, slug="token-other")
    enable_research(other)
    token = APIToken.objects.create(user=owner, workspace=other, label="other-workspace")
    client = APIClient()

    response = client.get(
        f"/api/research/workspaces/{workspace.slug}/context/",
        HTTP_X_API_KEY=token.token,
    )

    assert response.status_code == 404


def test_context_does_not_return_an_unrelated_private_project(env):
    owner, workspace, _project = env
    other = make_user(first_name="Other")
    add_workspace_member(workspace, other)
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=OrgUnit.objects.get(workspace=workspace),
        user=other,
        org_role=OrgUnitMember.OrgRole.REVIEWER,
        is_primary=True,
    )
    other_client = APIClient()
    other_client.force_authenticate(user=other)
    private_project = other_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"research_type": "PHD", "name": "Other private project"},
        format="json",
    ).json()

    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    response = owner_client.get(
        f"/api/research/workspaces/{workspace.slug}/context/?project_id={private_project['id']}"
    )

    assert response.status_code == 200
    assert response.data["resources"] == []


def test_context_paginates_projects_before_building_timelines(env, mocker):
    owner, workspace, first_project = env
    client = APIClient()
    client.force_authenticate(user=owner)
    second = client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"research_type": "RESEARCH_PROJECT", "name": "Team project"},
        format="json",
    )
    assert second.status_code == 201
    timeline = mocker.patch(
        "plane.research.services.chain.build_timeline",
        return_value={"items": [], "count": 0},
    )

    response = client.get(f"/api/research/workspaces/{workspace.slug}/context/?page=1&page_size=1")

    assert response.status_code == 200
    assert response.data["pagination"] == {
        "page": 1,
        "page_size": 1,
        "total": 2,
        "has_more": True,
    }
    assert len([item for item in response.data["resources"] if item["kind"] == "project"]) == 1
    assert timeline.call_count == 0


def test_context_index_query_count_is_flat_for_many_projects(env):
    owner, workspace, first_project = env
    client = APIClient()
    client.force_authenticate(user=owner)
    root = OrgUnit.objects.get(workspace=workspace)

    with CaptureQueriesContext(connection) as small_queries:
        small = client.get(f"/api/research/workspaces/{workspace.slug}/context/?page_size=50")
    assert small.status_code == 200

    projects = [
        Project(
            workspace=workspace,
            name=f"Context project {index}",
            identifier=f"CTX{index:03d}",
            created_by=owner,
        )
        for index in range(49)
    ]
    Project.objects.bulk_create(projects)
    ResearchProjectProfile.objects.bulk_create(
        [
            ResearchProjectProfile(
                project=project,
                workspace=workspace,
                owner=owner,
                org_unit=root,
                research_type=ResearchProjectProfile.ResearchType.RESEARCH_PROJECT,
                created_by=owner,
            )
            for project in projects
        ]
    )
    ProjectMember.objects.bulk_create(
        [
            ProjectMember(
                workspace=workspace,
                project=project,
                member=owner,
                role=20,
            )
            for project in projects
        ]
    )
    ResearchStageInstance.objects.bulk_create(
        [
            ResearchStageInstance(
                workspace=workspace,
                project=project,
                stage="PRE_OPENING",
                status=ResearchStageInstance.Status.NOT_STARTED,
                sort_order=1,
                org_unit=root,
            )
            for project in projects
        ]
    )

    with CaptureQueriesContext(connection) as large_queries:
        large = client.get(f"/api/research/workspaces/{workspace.slug}/context/?page_size=50")

    assert large.status_code == 200
    assert large.data["pagination"]["total"] == 50
    assert len([item for item in large.data["resources"] if item["kind"] == "project"]) == 50
    assert all(item["link"] for item in large.data["resources"])
    assert len(large_queries) - len(small_queries) <= 5


def resource_url(workspace, kind, resource_id, version=None):
    url = f"/api/research/workspaces/{workspace.slug}/context/resources/{kind}/{resource_id}/"
    return f"{url}?version={version}" if version is not None else url


def test_report_resource_defaults_to_latest_official_version_and_draft_is_author_only(env):
    owner, workspace, _project = env
    advisor = make_user(first_name="Advisor")
    add_workspace_member(workspace, advisor)
    root = OrgUnit.objects.get(workspace=workspace)
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=root,
        user=advisor,
        org_role=OrgUnitMember.OrgRole.ADVISOR,
    )
    MentorBinding.objects.create(
        workspace=workspace,
        org_unit=root,
        mentee=owner,
        mentor=advisor,
        is_primary_advisor=True,
    )
    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    report = owner_client.post(
        f"/api/research/workspaces/{workspace.slug}/reports/",
        {"report_type": "WEEKLY", "period_key": "2026-W38"},
        format="json",
    ).json()
    page = Page.objects.get(pk=report["page"])
    page.description_html = "<p>Official v1</p>"
    page.save()
    submitted = owner_client.post(
        f"/api/research/workspaces/{workspace.slug}/reports/{report['id']}/submit/",
        {},
        format="json",
    )
    assert submitted.status_code == 200
    PeriodicReport.objects.filter(pk=report["id"]).update(status="NEEDS_REVISION")
    page.description_html = "<p>Private draft</p>"
    page.save()

    latest = owner_client.get(resource_url(workspace, "report", report["id"]))
    draft = owner_client.get(resource_url(workspace, "report", report["id"], "draft"))
    advisor_client = APIClient()
    advisor_client.force_authenticate(user=advisor)
    advisor_draft = advisor_client.get(resource_url(workspace, "report", report["id"], "draft"))

    assert latest.status_code == 200
    assert latest.data["version"] == 1
    assert latest.data["content"]["description_html"] == "<p>Official v1</p>"
    assert draft.status_code == 200
    assert draft.data["version"] == "draft"
    assert draft.data["content"]["description_html"] == "<p>Private draft</p>"
    assert advisor_draft.status_code == 404
    audits = ResearchAuditEvent.objects.filter(action="context.read", resource_id=report["id"])
    assert audits.count() == 2
    assert all("content" not in event.metadata for event in audits)


def test_material_and_experiment_resources_resolve_requested_immutable_versions(env):
    owner, workspace, project = env
    stage = ResearchStageInstance.objects.filter(project_id=project["id"]).first()
    material_page = Page.objects.create(
        workspace=workspace,
        owned_by=owner,
        name="Opening material",
        description_html="<p>Draft material</p>",
        access=Page.PRIVATE_ACCESS,
    )
    material = StageMaterial.objects.create(
        stage_instance=stage,
        material_type="TOPIC_DESCRIPTION",
        page=material_page,
        status=StageMaterial.Status.SUBMITTED,
        submitted_at=timezone.now(),
        last_version_no=2,
        owner=owner,
    )
    StageMaterialVersion.objects.create(
        material=material,
        version_no=1,
        snapshot={"description_html": "<p>Material v1</p>", "status": "SUBMITTED"},
        created_by=owner,
    )
    StageMaterialVersion.objects.create(
        material=material,
        version_no=2,
        snapshot={"description_html": "<p>Material v2</p>", "status": "SUBMITTED"},
        created_by=owner,
    )
    experiment = ExperimentRecord.objects.create(
        workspace=workspace,
        project_id=project["id"],
        sequence_no=1,
        title="Experiment draft",
        owner=owner,
        submitted_at=timezone.now(),
        status=ExperimentRecord.Status.COMPLETED,
        current_version_no=2,
    )
    ExperimentRecordVersion.objects.create(
        record=experiment,
        version_no=1,
        snapshot={"title": "Experiment v1", "version_no": 1},
        change_source=ExperimentRecordVersion.ChangeSource.SUBMIT,
        created_by=owner,
    )
    ExperimentRecordVersion.objects.create(
        record=experiment,
        version_no=2,
        snapshot={"title": "Experiment v2", "version_no": 2},
        change_source=ExperimentRecordVersion.ChangeSource.AMENDMENT,
        created_by=owner,
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    material_v1 = client.get(resource_url(workspace, "stage_material", material.id, "1"))
    experiment_latest = client.get(resource_url(workspace, "experiment", experiment.id))

    assert material_v1.status_code == 200
    assert material_v1.data["version"] == 1
    assert material_v1.data["content"]["description_html"] == "<p>Material v1</p>"
    assert experiment_latest.status_code == 200
    assert experiment_latest.data["version"] == 2
    assert experiment_latest.data["content"]["title"] == "Experiment v2"


def test_external_reference_body_is_never_returned_even_when_source_acl_is_public(env):
    owner, workspace, _project = env
    reference = ResearchExternalReference.objects.create(
        workspace=workspace,
        system="RAGPORTAL",
        external_type="KNOWLEDGE_ENTRY",
        external_id="public-body",
        title="Public reference",
        summary="Locally cached summary must not become a body endpoint.",
        source_url="https://example.com/public-body",
        acl_hint={"public": True},
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get(resource_url(workspace, "external_reference", reference.id))

    assert response.status_code == 404
    assert response.data["error_code"] == "context_resource_not_found"


def test_external_reference_index_requires_the_linked_plane_resource_acl(env):
    owner, workspace, project = env
    teammate = make_user(first_name="Teammate")
    add_workspace_member(workspace, teammate)
    root = OrgUnit.objects.get(workspace=workspace)
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=root,
        user=teammate,
        org_role=OrgUnitMember.OrgRole.REVIEWER,
        is_primary=True,
    )
    private_experiment = ExperimentRecord.objects.create(
        workspace=workspace,
        project_id=project["id"],
        sequence_no=2,
        title="Owner private draft",
        owner=owner,
        status=ExperimentRecord.Status.PLANNED,
    )
    reference = ResearchExternalReference.objects.create(
        workspace=workspace,
        system="RAGPORTAL",
        external_type="DATA_ASSET",
        external_id="public-source-private-plane-target",
        title="Must stay hidden",
        source_url="https://example.com/hidden",
        acl_hint={"public": True},
    )
    ExternalReferenceLink.objects.create(
        reference=reference,
        target_type=ExternalReferenceLink.TargetType.EXPERIMENT_RECORD,
        target_id=private_experiment.id,
        created_by=owner,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project_id=project["id"],
        member=teammate,
        role=15,
    )
    client = APIClient()
    client.force_authenticate(user=teammate)

    response = client.get(f"/api/research/workspaces/{workspace.slug}/context/?project_id={project['id']}")

    assert response.status_code == 200
    assert not any(item["id"] == str(reference.id) for item in response.data["resources"])


def test_external_reference_index_rejects_cross_workspace_links(env):
    owner, workspace, project = env
    other_workspace = make_workspace(owner, slug="context-reference-other")
    reference = ResearchExternalReference.objects.create(
        workspace=other_workspace,
        system="RAGPORTAL",
        external_type="KNOWLEDGE_ENTRY",
        external_id="cross-workspace-public-source",
        title="Must not cross workspace boundary",
        source_url="https://example.com/cross-workspace",
        acl_hint={"public": True},
    )
    ExternalReferenceLink.objects.create(
        reference=reference,
        target_type=ExternalReferenceLink.TargetType.PROJECT,
        target_id=project["id"],
        created_by=owner,
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get(f"/api/research/workspaces/{workspace.slug}/context/?project_id={project['id']}")

    assert response.status_code == 200
    assert not any(item["id"] == str(reference.id) for item in response.data["resources"])


@pytest.mark.parametrize("version", ["0", "-1", "v1", "drafts"])
def test_resource_endpoint_rejects_invalid_versions(env, version):
    owner, workspace, project = env
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get(resource_url(workspace, "project", project["id"], version))

    assert response.status_code == 400
    assert response.data["error_code"] == "context_version_invalid"


def test_resource_endpoint_rejects_an_invalid_uuid(env):
    owner, workspace, _project = env
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get(resource_url(workspace, "report", "not-a-uuid"))

    assert response.status_code == 400
    assert response.data["error_code"] == "context_resource_invalid"


def test_resource_endpoint_hides_an_unknown_kind(env):
    owner, workspace, project = env
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get(resource_url(workspace, "unknown", project["id"]))

    assert response.status_code == 404
    assert response.data["error_code"] == "context_resource_not_found"
