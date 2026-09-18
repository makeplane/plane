# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Team research projects let active Plane project members add their own records."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    CodeArtifact,
    ExperimentRecord,
    FileAsset,
    LiteratureEntry,
    OrgUnit,
    OrgUnitMember,
    ProjectCodeRepository,
    ProjectMember,
    ResearchAuditEvent,
    ResearchOutcome,
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
def team_env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    owner = make_user(first_name="Owner")
    member = make_user(first_name="Member")
    project_admin = make_user(first_name="Project Admin")
    guest = make_user(first_name="Guest")
    inactive_member = make_user(first_name="Inactive")
    for user in (owner, member, project_admin, guest, inactive_member):
        add_workspace_member(workspace, user)

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
        workspace=workspace,
        org_unit=group,
        user=owner,
        org_role=OrgUnitMember.OrgRole.PI,
    )

    admin_client = client_for(admin)
    created = admin_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {
            "name": "Team project",
            "owner": str(owner.id),
            "org_unit": str(group.id),
            "research_type": "RESEARCH_PROJECT",
        },
        format="json",
    )
    assert created.status_code == 201, created.json()
    project_id = created.json()["id"]
    ProjectMember.objects.create(project_id=project_id, member=member, role=15)
    ProjectMember.objects.create(project_id=project_id, member=project_admin, role=20)
    ProjectMember.objects.create(project_id=project_id, member=guest, role=5)
    ProjectMember.objects.create(
        project_id=project_id,
        member=inactive_member,
        role=15,
        is_active=False,
    )
    return {
        "workspace": workspace,
        "project_id": project_id,
        "owner": owner,
        "member": member,
        "project_admin": project_admin,
        "guest": guest,
        "inactive_member": inactive_member,
        "owner_client": client_for(owner),
        "member_client": client_for(member),
        "project_admin_client": client_for(project_admin),
        "guest_client": client_for(guest),
        "inactive_member_client": client_for(inactive_member),
    }


def project_url(env, resource):
    return (
        f"/api/research/workspaces/{env['workspace'].slug}/projects/"
        f"{env['project_id']}/{resource}/"
    )


@pytest.mark.django_db
class TestTeamProjectContentCreation:
    @pytest.mark.parametrize("client_name", ("member_client", "project_admin_client"))
    def test_active_project_members_create_their_own_experiments(self, team_env, client_name):
        actor = team_env[client_name.replace("_client", "")]
        response = team_env[client_name].post(
            project_url(team_env, "experiments"),
            {"title": f"{actor.first_name} run", "owner": str(team_env["owner"].id)},
            format="json",
        )

        assert response.status_code == 201, response.json()
        record = ExperimentRecord.objects.get(pk=response.json()["id"])
        assert record.owner_id == actor.id
        assert record.created_by_id == actor.id
        assert record.stage_instance_id is None

    def test_active_project_member_creates_own_literature(self, team_env):
        response = team_env["member_client"].post(
            project_url(team_env, "literature"),
            {
                "title": "Member paper",
                "status": "COLLECTED",
                "owner": str(team_env["owner"].id),
            },
            format="json",
        )

        assert response.status_code == 201, response.json()
        entry = LiteratureEntry.objects.get(pk=response.json()["id"])
        assert entry.owner_id == team_env["member"].id
        assert entry.created_by_id == team_env["member"].id
        assert entry.stage_instance_id is None

    def test_active_project_member_imports_own_literature(self, team_env):
        response = team_env["member_client"].post(
            project_url(team_env, "literature/import"),
            {"format": "doi", "content": "10.1000/team | Team paper"},
            format="json",
        )

        assert response.status_code == 200, response.json()
        entry = LiteratureEntry.objects.get(doi="10.1000/team")
        assert entry.owner_id == team_env["member"].id
        assert entry.created_by_id == team_env["member"].id
        assert entry.stage_instance_id is None

    def test_active_project_member_ingests_own_experiment(self, team_env):
        response = team_env["member_client"].post(
            project_url(team_env, "experiments/ingest"),
            {
                "external_run_id": "team-run-1",
                "title": "Team automated run",
                "owner": str(team_env["owner"].id),
            },
            format="json",
        )

        assert response.status_code == 201, response.json()
        record = ExperimentRecord.objects.get(pk=response.json()["id"])
        assert record.owner_id == team_env["member"].id
        assert record.created_by_id == team_env["member"].id
        assert record.stage_instance_id is None

    def test_active_project_member_creates_repository_and_artifact(self, team_env):
        repository_response = team_env["member_client"].post(
            project_url(team_env, "code-repositories"),
            {
                "repository_url": "https://github.com/example/member-analysis",
                "created_by": str(team_env["owner"].id),
            },
            format="json",
        )
        assert repository_response.status_code == 201, repository_response.json()
        repository = ProjectCodeRepository.objects.get(pk=repository_response.json()["id"])
        assert repository.created_by_id == team_env["member"].id
        repository_list = team_env["member_client"].get(
            project_url(team_env, "code-repositories")
        ).json()
        assert str(repository.id) in {item["id"] for item in repository_list["results"]}
        updated_repository = team_env["member_client"].patch(
            f"/api/research/workspaces/{team_env['workspace'].slug}/code-repositories/"
            f"{repository.id}/",
            {"default_branch": "develop"},
            format="json",
        )
        assert updated_repository.status_code == 200, updated_repository.json()

        artifact_response = team_env["member_client"].post(
            f"/api/research/workspaces/{team_env['workspace'].slug}/code-repositories/"
            f"{repository.id}/artifacts/",
            {
                "ref_type": "COMMIT",
                "ref_value": "member123",
                "created_by": str(team_env["owner"].id),
            },
            format="json",
        )
        assert artifact_response.status_code == 201, artifact_response.json()
        artifact = CodeArtifact.objects.get(pk=artifact_response.json()["id"])
        assert artifact.created_by_id == team_env["member"].id
        artifact_list = team_env["member_client"].get(
            f"/api/research/workspaces/{team_env['workspace'].slug}/code-repositories/"
            f"{repository_response.json()['id']}/artifacts/"
        ).json()
        assert str(artifact.id) in {item["id"] for item in artifact_list["results"]}
        updated_artifact = team_env["member_client"].patch(
            f"/api/research/workspaces/{team_env['workspace'].slug}/code-artifacts/"
            f"{artifact.id}/",
            {"description": "member notes"},
            format="json",
        )
        assert updated_artifact.status_code == 200, updated_artifact.json()

    def test_active_project_member_creates_artifact_in_an_existing_team_repository(self, team_env):
        repository_response = team_env["owner_client"].post(
            project_url(team_env, "code-repositories"),
            {"repository_url": "https://github.com/example/shared-analysis"},
            format="json",
        )
        assert repository_response.status_code == 201, repository_response.json()

        artifact_response = team_env["member_client"].post(
            f"/api/research/workspaces/{team_env['workspace'].slug}/code-repositories/"
            f"{repository_response.json()['id']}/artifacts/",
            {"ref_type": "BRANCH", "ref_value": "member-analysis"},
            format="json",
        )
        assert artifact_response.status_code == 201, artifact_response.json()
        artifact = CodeArtifact.objects.get(pk=artifact_response.json()["id"])
        assert artifact.created_by_id == team_env["member"].id

    def test_active_project_member_creates_own_outcome(self, team_env):
        response = team_env["member_client"].post(
            project_url(team_env, "outcomes"),
            {
                "title": "Member dataset",
                "output_type": "DATASET",
                "created_by": str(team_env["owner"].id),
            },
            format="json",
        )

        assert response.status_code == 201, response.json()
        outcome = ResearchOutcome.objects.get(pk=response.json()["id"])
        assert outcome.created_by_id == team_env["member"].id
        outcome_list = team_env["member_client"].get(
            project_url(team_env, "outcomes")
        ).json()
        assert str(outcome.id) in {item["id"] for item in outcome_list["results"]}
        updated = team_env["member_client"].patch(
            f"/api/research/workspaces/{team_env['workspace'].slug}/outcomes/{outcome.id}/",
            {"title": "Member dataset v2"},
            format="json",
        )
        assert updated.status_code == 200, updated.json()

    def test_team_member_cannot_change_another_members_content(self, team_env):
        experiment_response = team_env["project_admin_client"].post(
            project_url(team_env, "experiments"), {"title": "Admin run"}, format="json"
        )
        literature_response = team_env["project_admin_client"].post(
            project_url(team_env, "literature"),
            {"title": "Admin paper", "status": "COLLECTED"},
            format="json",
        )
        repository_response = team_env["project_admin_client"].post(
            project_url(team_env, "code-repositories"),
            {"repository_url": "https://github.com/example/admin-analysis"},
            format="json",
        )
        artifact_response = team_env["project_admin_client"].post(
            f"/api/research/workspaces/{team_env['workspace'].slug}/code-repositories/"
            f"{repository_response.json()['id']}/artifacts/",
            {"ref_type": "COMMIT", "ref_value": "admin123"},
            format="json",
        )
        outcome_response = team_env["project_admin_client"].post(
            project_url(team_env, "outcomes"), {"title": "Admin outcome"}, format="json"
        )
        assert all(
            response.status_code == 201
            for response in (
                experiment_response,
                literature_response,
                repository_response,
                artifact_response,
                outcome_response,
            )
        )

        workspace_base = f"/api/research/workspaces/{team_env['workspace'].slug}"
        blocked_changes = (
            (
                f"{workspace_base}/experiments/{experiment_response.json()['id']}/",
                {"title": "changed"},
            ),
            (
                f"{workspace_base}/literature/{literature_response.json()['id']}/",
                {"title": "changed"},
            ),
            (
                f"{workspace_base}/code-repositories/{repository_response.json()['id']}/",
                {"default_branch": "changed"},
            ),
            (
                f"{workspace_base}/code-artifacts/{artifact_response.json()['id']}/",
                {"description": "changed"},
            ),
            (
                f"{workspace_base}/outcomes/{outcome_response.json()['id']}/",
                {"title": "changed"},
            ),
        )
        for url, payload in blocked_changes:
            response = team_env["member_client"].patch(url, payload, format="json")
            assert response.status_code in (403, 404), (url, response.json())

    def test_project_admin_cross_author_updates_are_audited_with_values(self, team_env):
        experiment = team_env["member_client"].post(
            project_url(team_env, "experiments"),
            {"title": "Member run"},
            format="json",
        )
        literature = team_env["member_client"].post(
            project_url(team_env, "literature"),
            {"title": "Member paper", "status": "COLLECTED"},
            format="json",
        )
        repository = team_env["member_client"].post(
            project_url(team_env, "code-repositories"),
            {"repository_url": "https://github.com/example/member-audit"},
            format="json",
        )
        artifact = team_env["member_client"].post(
            f"/api/research/workspaces/{team_env['workspace'].slug}/code-repositories/"
            f"{repository.json()['id']}/artifacts/",
            {"ref_type": "COMMIT", "ref_value": "audit123", "description": "Member notes"},
            format="json",
        )
        outcome = team_env["member_client"].post(
            project_url(team_env, "outcomes"),
            {"title": "Member result", "status": "PUBLISHED"},
            format="json",
        )
        assert all(
            response.status_code == 201
            for response in (experiment, literature, repository, artifact, outcome)
        )

        workspace_base = f"/api/research/workspaces/{team_env['workspace'].slug}"
        changes = (
            (
                experiment.json()["id"],
                f"{workspace_base}/experiments/{experiment.json()['id']}/",
                "title",
                "Member run",
                "Reviewed team run",
            ),
            (
                literature.json()["id"],
                f"{workspace_base}/literature/{literature.json()['id']}/",
                "title",
                "Member paper",
                "Reviewed team paper",
            ),
            (
                repository.json()["id"],
                f"{workspace_base}/code-repositories/{repository.json()['id']}/",
                "default_branch",
                "main",
                "reviewed",
            ),
            (
                artifact.json()["id"],
                f"{workspace_base}/code-artifacts/{artifact.json()['id']}/",
                "description",
                "Member notes",
                "Reviewed team notes",
            ),
            (
                outcome.json()["id"],
                f"{workspace_base}/outcomes/{outcome.json()['id']}/",
                "title",
                "Member result",
                "Reviewed team result",
            ),
        )
        for resource_id, url, field, before, after in changes:
            response = team_env["project_admin_client"].patch(
                url, {field: after}, format="json"
            )
            assert response.status_code == 200, (url, response.json())
            event = ResearchAuditEvent.objects.filter(resource_id=resource_id).latest(
                "created_at"
            )
            assert event.metadata["delegated"] is True
            assert event.metadata["before"][field] == before
            assert event.metadata["after"][field] == after

    @pytest.mark.parametrize("client_name", ("guest_client", "inactive_member_client"))
    @pytest.mark.parametrize(
        ("resource", "payload"),
        (
            ("experiments", {"title": "No access"}),
            ("literature", {"title": "No access", "status": "COLLECTED"}),
            ("code-repositories", {"repository_url": "https://github.com/example/no-access"}),
            ("outcomes", {"title": "No access"}),
        ),
    )
    def test_guest_and_inactive_members_cannot_create_team_content(
        self, team_env, client_name, resource, payload
    ):
        response = team_env[client_name].post(
            project_url(team_env, resource), payload, format="json"
        )
        expected = 403 if client_name == "guest_client" else 404
        assert response.status_code == expected

    def test_revoked_team_member_cannot_mutate_a_linked_asset_through_generic_api(self, team_env):
        asset = FileAsset.objects.create(
            workspace=team_env["workspace"],
            user=team_env["member"],
            created_by=team_env["member"],
            asset=f"research/{team_env['project_id']}/member-result.pdf",
            attributes={"name": "member-result.pdf", "type": "application/pdf"},
            size=1024,
            is_uploaded=True,
        )
        FileAsset.objects.filter(pk=asset.pk).update(created_by=team_env["member"])
        asset.refresh_from_db()
        created = team_env["member_client"].post(
            project_url(team_env, "outcomes"),
            {
                "title": "Formal member result",
                "status": "PUBLISHED",
                "file_asset": str(asset.id),
            },
            format="json",
        )
        assert created.status_code == 201, created.json()
        ProjectMember.objects.filter(
            project_id=team_env["project_id"],
            member=team_env["member"],
        ).update(is_active=False)

        response = team_env["member_client"].delete(
            f"/api/assets/v2/workspaces/{team_env['workspace'].slug}/{asset.id}/"
        )

        assert response.status_code == 403
        asset.refresh_from_db()
        assert asset.deleted_at is None


@pytest.mark.django_db
class TestCultivationProjectContentCreation:
    def test_active_project_member_does_not_gain_cultivation_project_creation(self, team_env):
        response = team_env["owner_client"].post(
            f"/api/research/workspaces/{team_env['workspace'].slug}/projects/",
            {"owner": str(team_env["owner"].id), "research_type": "PHD"},
            format="json",
        )
        assert response.status_code == 201, response.json()
        cultivation_project_id = response.json()["id"]
        ProjectMember.objects.create(
            project_id=cultivation_project_id,
            member=team_env["member"],
            role=15,
        )

        base = (
            f"/api/research/workspaces/{team_env['workspace'].slug}/projects/"
            f"{cultivation_project_id}"
        )
        cases = (
            (f"{base}/experiments/", {"title": "No access"}),
            (f"{base}/literature/", {"title": "No access", "status": "COLLECTED"}),
            (
                f"{base}/code-repositories/",
                {"repository_url": "https://github.com/example/cultivation-no-access"},
            ),
            (f"{base}/outcomes/", {"title": "No access"}),
        )
        for url, payload in cases:
            result = team_env["member_client"].post(url, payload, format="json")
            assert result.status_code == 403, (url, result.json())
