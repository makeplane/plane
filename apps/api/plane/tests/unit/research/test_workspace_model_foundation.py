# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date
from importlib import import_module
from types import SimpleNamespace

import pytest
from django.apps import apps as django_apps
from django.core.exceptions import ValidationError

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    Page,
    PeriodicReport,
    PeriodicReportProjectReference,
    PeriodicReportSnapshot,
    Profile,
    Project,
    ResearchWorkspaceAccessGrant,
    WorkspaceResearchSetting,
)
from plane.tests.research_fixtures import make_user, make_workspace

pytestmark = [pytest.mark.unit, pytest.mark.django_db]


def _make_report(*, workspace, owner, project=None):
    page = Page.objects.create(
        workspace=workspace,
        name="2026-W01 weekly report",
        description_json={"type": "doc", "content": []},
        description_html="<p>Draft</p>",
        owned_by=owner,
        access=Page.PRIVATE_ACCESS,
    )
    return PeriodicReport.objects.create(
        workspace=workspace,
        project=project,
        owner=owner,
        page=page,
        report_type=PeriodicReport.ReportType.WEEKLY,
        period_key="2026-W01",
        period_start=date(2025, 12, 29),
        period_end=date(2026, 1, 4),
    )


def test_workspace_research_configuration_keeps_workspace_core_generic():
    owner = make_user()
    principal_investigator = make_user()
    technical_admin = make_user()
    workspace = make_workspace(owner)

    setting = WorkspaceResearchSetting.objects.create(
        workspace=workspace,
        purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        main_pi=principal_investigator,
    )
    ResearchWorkspaceAccessGrant.objects.create(setting=setting, user=technical_admin, granted_by=owner)

    setting.refresh_from_db()
    assert setting.purpose == "PI_PRIVATE"
    assert setting.main_pi == principal_investigator
    assert list(setting.private_access_users.all()) == [technical_admin]
    assert setting.required_reporter_categories == ["STUDENT", "POSTDOC"]
    assert not hasattr(workspace, "purpose")


def test_workspace_research_configuration_has_safe_compatibility_defaults():
    workspace = make_workspace(make_user())

    setting = WorkspaceResearchSetting.objects.create(workspace=workspace)

    assert setting.purpose == WorkspaceResearchSetting.Purpose.GENERAL
    assert setting.main_pi is None
    assert setting.private_access_users.count() == 0


def test_revoked_private_workspace_grant_is_not_active():
    owner = make_user()
    technical_admin = make_user()
    workspace = make_workspace(owner)
    setting = WorkspaceResearchSetting.objects.create(workspace=workspace)
    grant = ResearchWorkspaceAccessGrant.objects.create(setting=setting, user=technical_admin)

    grant.delete()

    assert not ResearchWorkspaceAccessGrant.objects.filter(setting=setting, user=technical_admin).exists()
    assert ResearchWorkspaceAccessGrant.all_objects.filter(setting=setting, user=technical_admin).exists()


def test_foundation_data_migration_classifies_legacy_workspaces_and_sets_chinese():
    public_owner = make_user()
    pi_owner = make_user()
    public_workspace = make_workspace(public_owner, slug="public")
    pi_workspace = make_workspace(pi_owner, slug="pi")
    public_setting = WorkspaceResearchSetting.objects.create(
        workspace=public_workspace,
        module_enabled=True,
    )
    public_profile = Profile.objects.create(user=public_owner, language="en")
    pi_profile = Profile.objects.create(user=pi_owner, language="en")
    migration = import_module("plane.db.migrations.0141_research_workspace_model_foundation")
    schema_editor = SimpleNamespace(connection=SimpleNamespace(alias="default"))

    migration.configure_existing_workspaces_and_language(django_apps, schema_editor)
    migration.configure_existing_workspaces_and_language(django_apps, schema_editor)

    public_setting.refresh_from_db()
    pi_setting = WorkspaceResearchSetting.objects.get(workspace=pi_workspace)
    assert public_setting.purpose == WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH
    assert public_setting.module_enabled is True
    assert pi_setting.purpose == WorkspaceResearchSetting.Purpose.PI_PRIVATE
    assert pi_setting.module_enabled is False
    public_profile.refresh_from_db()
    pi_profile.refresh_from_db()
    assert public_profile.language == "zh-CN"
    assert pi_profile.language == "zh-CN"


def test_org_unit_business_category_is_optional_and_explicit():
    workspace = make_workspace(make_user())

    unclassified = OrgUnit.objects.create(workspace=workspace, name="Legacy group")
    basic_research = OrgUnit.objects.create(
        workspace=workspace,
        name="基础研究",
        business_category=OrgUnit.BusinessCategory.BASIC_RESEARCH,
    )
    mentor_group = OrgUnit.objects.create(
        workspace=workspace,
        name="直接导师组",
        business_category=OrgUnit.BusinessCategory.MENTOR_GROUP,
    )

    assert unclassified.business_category is None
    assert basic_research.business_category == "BASIC_RESEARCH"
    assert mentor_group.business_category == "MENTOR_GROUP"


def test_primary_advisor_periods_cannot_overlap_for_one_mentee():
    workspace = make_workspace(make_user())
    mentee = make_user()
    first_mentor = make_user()
    second_mentor = make_user()

    MentorBinding.objects.create(
        workspace=workspace,
        mentee=mentee,
        mentor=first_mentor,
        is_primary_advisor=True,
        effective_from=date(2026, 1, 1),
        effective_to=date(2026, 6, 30),
    )

    with pytest.raises(ValidationError, match="primary advisor period overlaps"):
        MentorBinding.objects.create(
            workspace=workspace,
            mentee=mentee,
            mentor=second_mentor,
            is_primary_advisor=True,
            effective_from=date(2026, 6, 1),
        )


def test_primary_advisor_history_allows_non_overlapping_successors():
    workspace = make_workspace(make_user())
    mentee = make_user()
    first_mentor = make_user()
    second_mentor = make_user()

    MentorBinding.objects.create(
        workspace=workspace,
        mentee=mentee,
        mentor=first_mentor,
        is_primary_advisor=True,
        effective_from=date(2026, 1, 1),
        effective_to=date(2026, 6, 30),
    )
    successor = MentorBinding.objects.create(
        workspace=workspace,
        mentee=mentee,
        mentor=second_mentor,
        is_primary_advisor=True,
        effective_from=date(2026, 7, 1),
    )

    assert successor.is_primary_advisor is True


def test_periodic_report_can_exist_without_a_cultivation_project_and_reference_team_projects():
    owner = make_user()
    workspace = make_workspace(owner)
    team_project = Project.objects.create(
        workspace=workspace,
        name="Team research project",
        identifier="TEAM",
        created_by=owner,
    )

    report = _make_report(workspace=workspace, owner=owner)
    reference = PeriodicReportProjectReference.objects.create(report=report, project=team_project)

    report.refresh_from_db()
    assert report.project is None
    assert list(report.team_projects.all()) == [team_project]
    assert reference.report == report


def test_periodic_report_snapshot_is_an_immutable_official_body():
    owner = make_user()
    workspace = make_workspace(owner)
    report = _make_report(workspace=workspace, owner=owner)

    snapshot = PeriodicReportSnapshot.objects.create(
        report=report,
        version_no=1,
        snapshot_status=PeriodicReport.Status.SUBMITTED,
        description_json={"type": "doc", "content": [{"type": "paragraph"}]},
        description_html="<p>Official body</p>",
        description_stripped="Official body",
        description_binary=b"official-body",
        submitted_by=owner,
    )

    snapshot.description_html = "<p>Changed</p>"
    with pytest.raises(TypeError, match="Append-only records cannot be updated"):
        snapshot.save()
    with pytest.raises(TypeError, match="Append-only records cannot be updated"):
        PeriodicReportSnapshot.objects.filter(pk=snapshot.pk).update(description_html="<p>Changed</p>")
    with pytest.raises(TypeError, match="Append-only records cannot be deleted"):
        snapshot.delete()
