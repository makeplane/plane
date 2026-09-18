# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from plane.db.models import (
    Cycle,
    FileAsset,
    Issue,
    IssueActivity,
    MentorBinding,
    Module,
    OrgUnit,
    OrgUnitMember,
    Page,
    Project,
    ProjectIdentifier,
    ProjectMember,
    ProjectPage,
    ResearchAuditEvent,
    ResearchProjectProfile,
    ResearchStageInstance,
    State,
    StageTransition,
    User,
    WorkspaceMember,
    WorkspaceResearchSetting,
)
from plane.license.models import InstanceAdmin, InstanceRoleAssignment
from plane.tests.research_fixtures import (
    make_instance,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.unit


def _command_json(name, *args, **options):
    stdout = StringIO()
    call_command(name, *args, stdout=stdout, **options)
    return json.loads(stdout.getvalue())


@pytest.fixture
def v3_environment(db):
    instance = make_instance()
    system_admin = make_user(email="admin@ai4ms.local", first_name="System", last_name="Admin")
    public = make_workspace(system_admin, name="Public research", slug="public")
    pi = make_workspace(system_admin, name="PI private", slug="pi")
    WorkspaceResearchSetting.objects.create(
        workspace=public,
        purpose=WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
        module_enabled=True,
    )
    pi_setting = WorkspaceResearchSetting.objects.create(
        workspace=pi,
        purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        module_enabled=True,
        main_pi=system_admin,
    )
    InstanceAdmin.objects.create(instance=instance, user=system_admin)

    developer = make_user(email="fangyikaii@163.com", first_name="Developer")
    InstanceAdmin.objects.create(instance=instance, user=developer)
    WorkspaceMember.objects.create(workspace=pi, member=developer, role=15)

    project = Project.objects.create(
        workspace=pi,
        name="admin 科研项目",
        identifier="ADMIN",
        created_by=system_admin,
    )
    ResearchProjectProfile.objects.create(
        project=project,
        workspace=pi,
        owner=system_admin,
        research_type=ResearchProjectProfile.ResearchType.RESEARCH_PROJECT,
        created_by=system_admin,
    )
    ProjectMember.objects.create(project=project, member=system_admin, role=20)
    ProjectIdentifier.objects.create(
        project=project,
        workspace=pi,
        name=project.identifier,
        created_by=system_admin,
    )
    audit = ResearchAuditEvent.objects.create(
        workspace=pi,
        actor=system_admin,
        action="fixture.created",
        resource_type="project",
        resource_id=project.id,
    )

    root = OrgUnit.objects.create(
        workspace=public,
        name="Root",
        unit_type=OrgUnit.UnitType.ROOT,
        path="/root/",
        depth=0,
        created_by=system_admin,
    )
    student = make_user(email="student@example.com", first_name="Student")
    WorkspaceMember.objects.create(workspace=public, member=student, role=15)
    OrgUnitMember.objects.create(
        workspace=public,
        org_unit=root,
        user=student,
        org_role=OrgUnitMember.OrgRole.REVIEWER,
        is_primary=False,
        created_by=system_admin,
    )
    secondary_mentor = make_user(email="mentor@example.com", first_name="Mentor")
    MentorBinding.objects.create(
        workspace=public,
        org_unit=root,
        mentee=student,
        mentor=secondary_mentor,
        is_primary_advisor=False,
        created_by=system_admin,
    )
    unclassified = OrgUnit.objects.create(
        workspace=public,
        parent=root,
        name="Legacy group",
        unit_type=OrgUnit.UnitType.GROUP,
        path="/root/legacy/",
        depth=1,
        business_category=None,
        created_by=system_admin,
    )
    return {
        "instance": instance,
        "system_admin": system_admin,
        "developer": developer,
        "public": public,
        "pi": pi,
        "pi_setting": pi_setting,
        "project": project,
        "audit": audit,
        "student": student,
        "unclassified": unclassified,
    }


@pytest.mark.django_db
def test_seed_baseline_default_only_ensures_authoritative_admin_and_workspace_purposes(db):
    instance = make_instance()

    result = _command_json("seed_system_baseline", json=True)

    admin = User.objects.get(email="admin@ai4ms.local")
    assert InstanceAdmin.objects.filter(instance=instance, user=admin).count() == 1
    assert not User.objects.filter(
        email__in=(
            "dev.admin@ai4ms.local",
            "ops.admin@ai4ms.local",
            "mainpi@ai4ms.local",
            "test.pi@ai4ms.local",
        )
    ).exists()
    assert result["workspaces"]["public"]["purpose"] == "PUBLIC_RESEARCH"
    assert result["workspaces"]["pi"]["purpose"] == "PI_PRIVATE"
    assert WorkspaceResearchSetting.objects.get(workspace__slug="public").module_enabled is True
    assert WorkspaceResearchSetting.objects.get(workspace__slug="pi").module_enabled is False


@pytest.mark.django_db
def test_seed_baseline_rerun_does_not_restore_revoked_tags_seats_or_disabled_module(db):
    make_instance()
    _command_json("seed_system_baseline", json=True)
    admin = User.objects.get(email="admin@ai4ms.local")
    public_setting = WorkspaceResearchSetting.objects.get(workspace__slug="public")
    public_setting.module_enabled = False
    public_setting.save(update_fields=["module_enabled", "updated_at"])
    public_membership = WorkspaceMember.objects.get(workspace__slug="public", member=admin)
    public_membership.is_active = False
    public_membership.save(update_fields=["is_active", "updated_at"])
    InstanceRoleAssignment.objects.create(
        instance=make_instance(),
        user=admin,
        role=InstanceRoleAssignment.AdminRole.DEV_ADMIN,
    ).delete()

    _command_json("seed_system_baseline", json=True)

    public_setting.refresh_from_db()
    public_membership.refresh_from_db()
    assert public_setting.module_enabled is False
    assert public_membership.is_active is False
    assert not InstanceRoleAssignment.objects.filter(user=admin, deleted_at__isnull=True).exists()


@pytest.mark.django_db
def test_v3_dry_run_previews_changes_without_mutating_state(v3_environment, tmp_path):
    env = v3_environment
    before = {
        "projects": Project.objects.filter(workspace=env["pi"]).count(),
        "admins": InstanceAdmin.objects.filter(instance=env["instance"]).count(),
        "developer_roles": InstanceRoleAssignment.objects.filter(user=env["developer"]).count(),
        "main_pi": str(env["pi_setting"].main_pi_id),
    }

    result = _command_json("migrate_research_workspace_v3")

    assert result["mode"] == "dry-run"
    assert result["public_workspace"]["members_missing_primary_org"] == [
        {"email": "student@example.com", "user_id": str(env["student"].id)}
    ]
    assert result["public_workspace"]["members_missing_primary_advisor"] == [
        {"email": "student@example.com", "user_id": str(env["student"].id)}
    ]
    assert result["public_workspace"]["org_units_pending_classification"] == [
        {
            "id": str(env["unclassified"].id),
            "name": "Legacy group",
            "unit_type": "GROUP",
        }
    ]
    assert result["pi_workspace"]["project_count"] == 1
    assert result["pi_workspace"]["projects"][0]["name"] == "admin 科研项目"
    assert result["administrators"]["demotion"]["email"] == "fangyikaii@163.com"
    assert result["administrators"]["demotion"]["target_role"] == "DEV_ADMIN"
    assert not list(tmp_path.iterdir())
    assert before == {
        "projects": Project.objects.filter(workspace=env["pi"]).count(),
        "admins": InstanceAdmin.objects.filter(instance=env["instance"]).count(),
        "developer_roles": InstanceRoleAssignment.objects.filter(user=env["developer"]).count(),
        "main_pi": str(WorkspaceResearchSetting.objects.get(pk=env["pi_setting"].pk).main_pi_id),
    }


@pytest.mark.django_db
def test_v3_apply_requires_a_backup_directory(v3_environment):
    with pytest.raises(CommandError, match="--apply requires --backup-dir"):
        call_command("migrate_research_workspace_v3", apply=True)


@pytest.mark.django_db
def test_v3_refuses_a_pi_slug_with_the_wrong_purpose(v3_environment, tmp_path):
    env = v3_environment
    setting = WorkspaceResearchSetting.objects.get(pk=env["pi_setting"].pk)
    setting.purpose = WorkspaceResearchSetting.Purpose.GENERAL
    setting.save(update_fields=["purpose", "updated_at"])

    with pytest.raises(CommandError, match="workspace 'pi' purpose mismatch"):
        call_command(
            "migrate_research_workspace_v3",
            apply=True,
            backup_dir=str(tmp_path / "research-v3-backups"),
        )

    assert Project.objects.filter(pk=env["project"].pk).exists()
    assert not (tmp_path / "research-v3-backups").exists()


@pytest.mark.django_db(transaction=True)
def test_v3_apply_backs_up_and_cleans_pi_projects_preserving_workspace_users_and_audit(
    v3_environment, tmp_path
):
    env = v3_environment
    backup_dir = tmp_path / "research-v3-backups"

    result = _command_json(
        "migrate_research_workspace_v3",
        apply=True,
        backup_dir=str(backup_dir),
    )

    backup_path = backup_dir / result["backup"]["filename"]
    assert backup_path.is_file()
    backup = json.loads(backup_path.read_text(encoding="utf-8"))
    assert backup["workspace"]["id"] == str(env["pi"].id)
    assert backup["projects"][0]["id"] == str(env["project"].id)
    assert backup["projects"][0]["name"] == "admin 科研项目"
    assert not Project.all_objects.filter(workspace=env["pi"]).exists()
    assert not ProjectMember.all_objects.filter(project_id=env["project"].id).exists()
    assert not ProjectIdentifier.all_objects.filter(project_id=env["project"].id).exists()
    assert User.objects.filter(pk=env["system_admin"].pk).exists()
    assert User.objects.filter(pk=env["developer"].pk).exists()
    assert ResearchAuditEvent.objects.filter(pk=env["audit"].pk).exists()
    assert WorkspaceResearchSetting.objects.get(pk=env["pi_setting"].pk).main_pi_id is None
    assert WorkspaceResearchSetting.objects.get(pk=env["pi_setting"].pk).module_enabled is False
    assert not InstanceAdmin.objects.filter(instance=env["instance"], user=env["developer"]).exists()
    assert InstanceRoleAssignment.objects.filter(
        instance=env["instance"],
        user=env["developer"],
        role=InstanceRoleAssignment.AdminRole.DEV_ADMIN,
        deleted_at__isnull=True,
    ).exists()
    pi_membership = WorkspaceMember.objects.get(workspace=env["pi"], member=env["developer"])
    assert pi_membership.is_active is False
    assert result["status"] == "applied"


@pytest.mark.django_db(transaction=True)
def test_v3_apply_backs_up_and_deletes_complete_plane_project_dependency_graph(
    v3_environment, tmp_path
):
    env = v3_environment
    project = env["project"]
    state = State.objects.create(
        name="Todo",
        color="#000000",
        group="unstarted",
        default=True,
        project=project,
        workspace=env["pi"],
        created_by=env["system_admin"],
    )
    issue = Issue.objects.create(
        name="PI private task",
        state=state,
        project=project,
        workspace=env["pi"],
        created_by=env["system_admin"],
    )
    activity = IssueActivity.objects.create(
        issue=issue,
        project=project,
        workspace=env["pi"],
        actor=env["system_admin"],
        verb="created",
    )
    cycle = Cycle.objects.create(
        name="PI private cycle",
        project=project,
        workspace=env["pi"],
        owned_by=env["system_admin"],
    )
    module = Module.objects.create(
        name="PI private module",
        project=project,
        workspace=env["pi"],
    )
    page = Page.objects.create(
        name="PI private project page",
        workspace=env["pi"],
        owned_by=env["system_admin"],
    )
    project_page = ProjectPage.objects.create(
        project=project,
        page=page,
        workspace=env["pi"],
    )
    asset = FileAsset.objects.create(
        asset="pi-private/project-attachment.txt",
        user=env["system_admin"],
        workspace=env["pi"],
        project=project,
        issue=issue,
        page=page,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_uploaded=True,
    )
    stage = ResearchStageInstance.objects.create(
        workspace=env["pi"],
        project=project,
        stage="PRE_OPENING",
        status=ResearchStageInstance.Status.IN_PROGRESS,
        sort_order=1,
    )
    transition = StageTransition.objects.create(
        stage_instance=stage,
        actor=env["system_admin"],
        action=StageTransition.Action.ENTER,
        from_status=ResearchStageInstance.Status.NOT_STARTED,
        to_status=ResearchStageInstance.Status.IN_PROGRESS,
    )

    result = _command_json(
        "migrate_research_workspace_v3",
        apply=True,
        backup_dir=str(tmp_path / "research-v3-backups"),
    )

    backup = json.loads(
        (tmp_path / "research-v3-backups" / result["backup"]["filename"]).read_text(
            encoding="utf-8"
        )
    )
    backed_up_models = {table["model"] for table in backup["tables"]}
    assert {
        "db.cycle",
        "db.fileasset",
        "db.issue",
        "db.issueactivity",
        "db.module",
        "db.page",
        "db.project",
        "db.projectidentifier",
        "db.projectpage",
        "db.state",
        "db.stagetransition",
    } <= backed_up_models
    assert not State.all_state_objects.filter(pk=state.pk).exists()
    assert not Issue.all_objects.filter(pk=issue.pk).exists()
    assert not IssueActivity.all_objects.filter(pk=activity.pk).exists()
    assert not Cycle.all_objects.filter(pk=cycle.pk).exists()
    assert not Module.all_objects.filter(pk=module.pk).exists()
    assert not ProjectPage.all_objects.filter(pk=project_page.pk).exists()
    assert not Page.all_objects.filter(pk=page.pk).exists()
    assert not FileAsset.all_objects.filter(pk=asset.pk).exists()
    assert not ResearchStageInstance.all_objects.filter(pk=stage.pk).exists()
    assert not StageTransition.objects.filter(pk=transition.pk).exists()
    assert ResearchAuditEvent.objects.filter(pk=env["audit"].pk).exists()
    backed_up_rows = {
        (table["model"], str(row["id"]))
        for table in backup["tables"]
        for row in table["rows"]
    }
    deleted_objects = {
        ("db.state", str(state.pk)),
        ("db.issue", str(issue.pk)),
        ("db.issueactivity", str(activity.pk)),
        ("db.cycle", str(cycle.pk)),
        ("db.module", str(module.pk)),
        ("db.projectpage", str(project_page.pk)),
        ("db.page", str(page.pk)),
        ("db.fileasset", str(asset.pk)),
        ("db.researchstageinstance", str(stage.pk)),
        ("db.stagetransition", str(transition.pk)),
    }
    assert deleted_objects <= backed_up_rows


@pytest.mark.django_db(transaction=True)
def test_v3_apply_refuses_to_demote_when_authoritative_system_admin_is_not_active(
    v3_environment, tmp_path
):
    env = v3_environment
    env["system_admin"].is_active = False
    env["system_admin"].save(update_fields=["is_active", "updated_at"])
    backup_dir = tmp_path / "research-v3-backups"

    with pytest.raises(CommandError, match="active InstanceAdmin"):
        call_command(
            "migrate_research_workspace_v3",
            apply=True,
            backup_dir=str(backup_dir),
        )

    assert Project.all_objects.filter(pk=env["project"].pk).exists()
    assert InstanceAdmin.objects.filter(
        instance=env["instance"], user=env["developer"]
    ).exists()
    assert not InstanceRoleAssignment.objects.filter(
        instance=env["instance"],
        user=env["developer"],
        role=InstanceRoleAssignment.AdminRole.DEV_ADMIN,
        deleted_at__isnull=True,
    ).exists()
    assert not backup_dir.exists()


@pytest.mark.django_db(transaction=True)
def test_v3_rerun_deactivates_a_new_unauthorized_pi_workspace_seat(
    v3_environment, tmp_path
):
    env = v3_environment
    backup_dir = tmp_path / "research-v3-backups"
    first = _command_json(
        "migrate_research_workspace_v3", apply=True, backup_dir=str(backup_dir)
    )
    developer_seat = WorkspaceMember.objects.get(
        workspace=env["pi"], member=env["developer"]
    )
    developer_seat.is_active = True
    developer_seat.save(update_fields=["is_active", "updated_at"])

    second = _command_json(
        "migrate_research_workspace_v3", apply=True, backup_dir=str(backup_dir)
    )

    developer_seat.refresh_from_db()
    assert first["status"] == "applied"
    assert second["status"] == "applied"
    assert second["backup"] is None
    assert developer_seat.is_active is False


@pytest.mark.django_db(transaction=True)
def test_v3_apply_is_idempotent(v3_environment, tmp_path):
    backup_dir = tmp_path / "research-v3-backups"
    first = _command_json("migrate_research_workspace_v3", apply=True, backup_dir=str(backup_dir))
    second = _command_json("migrate_research_workspace_v3", apply=True, backup_dir=str(backup_dir))

    assert first["status"] == "applied"
    assert second["status"] == "already-applied"
    assert second["backup"] is None
    assert len(list(backup_dir.glob("*.json"))) == 1
    assert not Project.all_objects.filter(workspace__slug="pi").exists()
    assert InstanceRoleAssignment.objects.filter(
        user__email="fangyikaii@163.com",
        role=InstanceRoleAssignment.AdminRole.DEV_ADMIN,
        deleted_at__isnull=True,
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_v3_rerun_clears_a_stale_public_main_pi_assignment(
    v3_environment, tmp_path
):
    env = v3_environment
    backup_dir = tmp_path / "research-v3-backups"
    first = _command_json(
        "migrate_research_workspace_v3", apply=True, backup_dir=str(backup_dir)
    )
    public_setting = WorkspaceResearchSetting.objects.get(workspace=env["public"])
    public_setting.main_pi = env["system_admin"]
    public_setting.save(update_fields=["main_pi", "updated_at"])

    second = _command_json(
        "migrate_research_workspace_v3", apply=True, backup_dir=str(backup_dir)
    )

    public_setting.refresh_from_db()
    assert first["status"] == "applied"
    assert second["status"] == "applied"
    assert second["backup"] is None
    assert public_setting.main_pi_id is None
