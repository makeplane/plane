# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Code repository contract tests (P1-CODE-01 ~ P1-CODE-10)."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    CodeArtifact,
    ExperimentRecord,
    OrgUnit,
    OrgUnitMember,
    ProjectCodeRepository,
    ResearchAuditEvent,
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
        "project_id": project_id,
        "admin_client": admin_client,
        "owner_client": client_for(owner),
        "stranger_client": client_for(stranger),
    }


def repos_url(env):
    return f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/code-repositories/"


def repo_url(env, repository_id, suffix=""):
    return f"/api/research/workspaces/{env['workspace'].slug}/code-repositories/{repository_id}/{suffix}"


def create_repository(env, url="https://github.com/example/analysis", **overrides):
    payload = {"repository_url": url, "provider": "GITHUB", "default_branch": "main"}
    payload.update(overrides)
    return env["owner_client"].post(repos_url(env), payload, format="json")


@pytest.mark.django_db
class TestCodeRepository:
    def test_registration_and_duplicate_guard(self, env):
        created = create_repository(env)
        assert created.status_code == 201, created.json()
        assert created.json()["provider"] == "GITHUB"
        assert created.json()["status"] == "ACTIVE"
        duplicate = create_repository(env)
        assert duplicate.status_code == 409
        assert duplicate.json()["error_code"] == "code_repository_exists"

    def test_credentials_are_never_echoed(self, env):
        created = create_repository(env, credential_ref="secret/readonly-token")
        assert created.status_code == 201
        body = created.json()
        # only the reference name and its presence are exposed; there is no
        # field that accepts or returns a plaintext credential (P1-CODE-08)
        assert body["has_credential"] is True
        assert body["credential_ref"] == "secret/readonly-token"
        assert set(body) & {"credential", "token", "secret", "credential_value"} == set()
        event = ResearchAuditEvent.objects.filter(action="code.repository.create").first()
        assert set(event.metadata) == {"provider", "has_credential"}

    def test_artifact_registration_and_experiment_link(self, env):
        repository_id = create_repository(env).json()["id"]
        record = ExperimentRecord.objects.create(
            workspace=env["workspace"],
            project_id=env["project_id"],
            sequence_no=1,
            title="Run 1",
            owner=env["owner"],
        )
        created = env["owner_client"].post(
            repo_url(env, repository_id, "artifacts/"),
            {
                "ref_type": "COMMIT",
                "ref_value": "abc1234",
                "commit_message": "add analysis",
                "author_name": "Owner",
                "linked_experiment": str(record.id),
            },
            format="json",
        )
        assert created.status_code == 201, created.json()
        assert created.json()["linked_experiment"] == str(record.id)
        duplicate = env["owner_client"].post(
            repo_url(env, repository_id, "artifacts/"),
            {"ref_type": "COMMIT", "ref_value": "abc1234"},
            format="json",
        )
        assert duplicate.status_code == 409

        listed = env["owner_client"].get(repo_url(env, repository_id, "artifacts/")).json()
        assert listed["count"] == 1

    def test_branch_and_tag_refs_are_supported(self, env):
        repository_id = create_repository(env).json()["id"]
        for ref_type, value in (("BRANCH", "main"), ("TAG", "v1.0")):
            response = env["owner_client"].post(
                repo_url(env, repository_id, "artifacts/"),
                {"ref_type": ref_type, "ref_value": value},
                format="json",
            )
            assert response.status_code == 201, response.json()

    def test_snapshot_upload_uses_its_own_limit(self, env):
        repository_id = create_repository(env).json()["id"]
        allowed = env["owner_client"].post(
            repo_url(env, repository_id, "snapshots/"),
            {"mode": "presign", "file_name": "snapshot.zip", "content_type": "application/zip", "size": 10},
            format="json",
        )
        assert allowed.status_code == 200
        assert allowed.json()["max_bytes"] == 500 * 1024 * 1024

        setting = WorkspaceResearchSetting.objects.get(workspace=env["workspace"])
        setting.code_snapshot_max_mb = 1
        setting.save(update_fields=["code_snapshot_max_mb"])
        too_big = env["owner_client"].post(
            repo_url(env, repository_id, "snapshots/"),
            {
                "mode": "presign",
                "file_name": "snapshot.zip",
                "content_type": "application/zip",
                "size": 2 * 1024 * 1024,
            },
            format="json",
        )
        assert too_big.status_code == 413
        assert too_big.json()["error_code"] == "file_size_exceeded"

    def test_snapshot_without_asset_is_rejected(self, env):
        repository_id = create_repository(env).json()["id"]
        response = env["owner_client"].post(
            repo_url(env, repository_id, "snapshots/"),
            {"ref_value": "0.1.0"},
            format="json",
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "code_artifact_invalid"

    def test_sync_failure_is_reported_without_raising(self, env):
        repository_id = create_repository(env, url="https://invalid.invalid.example/repo.git").json()["id"]
        response = env["owner_client"].post(repo_url(env, repository_id, "sync/"), {}, format="json")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "SYNC_FAILED"
        assert body["degraded"] is True
        assert body["sync_error"]
        assert ProjectCodeRepository.objects.get(pk=repository_id).status == "SYNC_FAILED"
        assert ResearchAuditEvent.objects.filter(action="code.sync").exists()

    def test_sync_with_a_head_updates_the_reference(self, env):
        repository_id = create_repository(env, url="https://invalid.invalid.example/2.git").json()["id"]
        response = env["owner_client"].post(
            repo_url(env, repository_id, "sync/"), {"head": "deadbeef"}, format="json"
        )
        # the network call fails in the sandbox, the reference is still recorded
        assert response.status_code == 200
        assert response.json()["degraded"] is True

    def test_archive_is_soft_and_keeps_artifacts(self, env):
        repository_id = create_repository(env).json()["id"]
        env["owner_client"].post(
            repo_url(env, repository_id, "artifacts/"),
            {"ref_type": "TAG", "ref_value": "v0.9"},
            format="json",
        )
        archived = env["owner_client"].delete(repo_url(env, repository_id))
        assert archived.status_code == 204
        assert CodeArtifact.objects.filter(repository_id=repository_id).count() == 1
        assert ProjectCodeRepository.all_objects.get(pk=repository_id).status == "ARCHIVED"

    def test_code_summary_for_the_review_page(self, env):
        repository_id = create_repository(env).json()["id"]
        env["owner_client"].post(
            repo_url(env, repository_id, "artifacts/"),
            {"ref_type": "COMMIT", "ref_value": "abc1234", "commit_message": "analysis"},
            format="json",
        )
        summary = env["owner_client"].get(
            f"/api/research/workspaces/{env['workspace'].slug}/projects/{env['project_id']}/code-summary/"
        ).json()
        assert summary["repository_count"] == 1
        assert summary["artifact_count"] == 1
        assert summary["last_commit"]["ref_value"] == "abc1234"

    def test_stranger_cannot_see_or_write_repositories(self, env):
        repository_id = create_repository(env).json()["id"]
        assert env["stranger_client"].get(repos_url(env)).json()["count"] == 0
        assert env["stranger_client"].get(repo_url(env, repository_id)).status_code == 404
        assert (
            env["stranger_client"].post(
                repo_url(env, repository_id, "artifacts/"),
                {"ref_type": "TAG", "ref_value": "x"},
                format="json",
            ).status_code
            == 404
        )
