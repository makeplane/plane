# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    OrgUnit,
    OrgUnitMember,
    Page,
    PeriodicReport,
    ReportAccessGrant,
    ReportReviewLog,
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


def create_unit(workspace, name, parent=None, unit_type=OrgUnit.UnitType.GROUP):
    unit = OrgUnit.objects.create(
        workspace=workspace,
        name=name,
        parent=parent,
        unit_type=unit_type,
        depth=(parent.depth + 1) if parent else 0,
        path="",
    )
    unit.path = (parent.path if parent else "/") + str(unit.id).replace("-", "") + "/"
    unit.save(update_fields=["path"])
    return unit


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    student = make_user(first_name="Student", email="student@example.com")
    advisor = make_user(first_name="Advisor", email="advisor@example.com")
    colleague = make_user(first_name="Colleague", email="colleague@example.com")
    for user in (student, advisor, colleague):
        add_workspace_member(workspace, user)

    root = create_unit(workspace, "Root", None, OrgUnit.UnitType.ROOT)
    group = create_unit(workspace, "Group", root, OrgUnit.UnitType.GROUP)
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=student, org_role=OrgUnitMember.OrgRole.OWNER
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=advisor, org_role=OrgUnitMember.OrgRole.ADVISOR
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=colleague, org_role=OrgUnitMember.OrgRole.REVIEWER
    )

    student_client = client_for(student)
    # every research owner needs an active project before creating reports
    student_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"org_unit": str(group.id)},
        format="json",
    )
    return {
        "admin": admin,
        "student": student,
        "advisor": advisor,
        "colleague": colleague,
        "workspace": workspace,
        "group": group,
        "admin_client": client_for(admin),
        "student_client": student_client,
        "advisor_client": client_for(advisor),
        "colleague_client": client_for(colleague),
        "url": f"/api/research/workspaces/{workspace.slug}/reports/",
    }


def create_report(env, **payload):
    return env["student_client"].post(
        env["url"],
        {"report_type": "WEEKLY", "period_key": "2026-W38", **payload},
        format="json",
    )


@pytest.mark.django_db
class TestReportCreation:
    def test_create_weekly_report_with_period_metadata(self, env):
        response = create_report(env)
        assert response.status_code == 201
        payload = response.json()
        assert payload["period_start"] == "2026-09-14"
        assert payload["period_end"] == "2026-09-20"
        assert payload["status"] == "DRAFT"
        assert payload["visibility"] == "DIRECT_ADVISOR"
        assert payload["is_backfill"] is False  # 2026-W38 is the current ISO week
        assert Page.objects.filter(pk=payload["page"]).exists()

    def test_historical_period_is_marked_as_backfill(self, env):
        response = create_report(env, period_key="2026-W10")
        assert response.status_code == 201
        assert response.json()["is_backfill"] is True

    def test_duplicate_period_is_rejected(self, env):
        assert create_report(env).status_code == 201
        duplicate = create_report(env)
        assert duplicate.status_code == 409
        assert duplicate.json()["error_code"] == "report_period_conflict"

    def test_monthly_report_uses_natural_month(self, env):
        response = create_report(env, report_type="MONTHLY", period_key="2026-09")
        assert response.status_code == 201
        assert response.json()["period_start"] == "2026-09-01"
        assert response.json()["period_end"] == "2026-09-30"

    def test_invalid_period_is_rejected(self, env):
        response = create_report(env, period_key="2026-99")
        assert response.status_code == 400

    def test_visibility_cannot_exceed_the_default(self, env):
        response = create_report(env, visibility="WORKSPACE")
        assert response.status_code == 422
        assert response.json()["error_code"] == "report_visibility_exceeds_default"

    def test_visibility_can_be_narrowed(self, env):
        response = create_report(env, visibility="PRIVATE")
        assert response.status_code == 201
        assert response.json()["visibility"] == "PRIVATE"

    def test_creation_requires_an_active_research_project(self, env):
        # the admin has no research project of their own
        response = env["admin_client"].post(
            env["url"], {"report_type": "WEEKLY", "period_key": "2026-W39"}, format="json"
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "research_project_not_found"


@pytest.mark.django_db
class TestReportStateMachine:
    def test_full_loop_submit_return_resubmit_accept(self, env):
        report = create_report(env).json()
        report_id = report["id"]
        detail_url = f"{env['url']}{report_id}/"

        submitted = env["student_client"].post(f"{detail_url}submit/", {}, format="json")
        assert submitted.status_code == 200
        assert submitted.json()["status"] == "SUBMITTED"

        # a second submit must not create another transition (409, P0-RPT-06)
        again = env["student_client"].post(f"{detail_url}submit/", {}, format="json")
        assert again.status_code == 409
        assert ReportReviewLog.objects.filter(report_id=report_id, action="SUBMIT").count() == 1

        returned = env["advisor_client"].post(
            f"{detail_url}return/", {"comment": "Please add the experiment log."}, format="json"
        )
        assert returned.status_code == 200
        assert returned.json()["status"] == "NEEDS_REVISION"

        resubmitted = env["student_client"].post(f"{detail_url}submit/", {}, format="json")
        assert resubmitted.status_code == 200
        assert resubmitted.json()["status"] == "SUBMITTED"

        accepted = env["advisor_client"].post(f"{detail_url}accept/", {}, format="json")
        assert accepted.status_code == 200
        assert accepted.json()["status"] == "ACCEPTED"

        history = env["student_client"].get(f"{detail_url}history/").json()
        assert history["count"] == 4
        actions = [entry["action"] for entry in history["results"]]
        assert actions == ["ACCEPT", "SUBMIT", "RETURN", "SUBMIT"]

    def test_return_requires_a_reason(self, env):
        report = create_report(env).json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        response = env["advisor_client"].post(
            f"{env['url']}{report['id']}/return/", {"comment": ""}, format="json"
        )
        assert response.status_code == 422
        assert response.json()["error_code"] == "report_return_reason_required"

    def test_only_the_owner_can_submit(self, env):
        report = create_report(env).json()
        response = env["advisor_client"].post(
            f"{env['url']}{report['id']}/submit/", {}, format="json"
        )
        assert response.status_code == 404

    def test_colleague_cannot_review(self, env):
        report = create_report(env).json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        response = env["colleague_client"].post(
            f"{env['url']}{report['id']}/accept/", {}, format="json"
        )
        assert response.status_code == 403

    def test_accepted_report_is_terminal(self, env):
        report = create_report(env).json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        env["advisor_client"].post(f"{env['url']}{report['id']}/accept/", {}, format="json")
        response = env["advisor_client"].post(
            f"{env['url']}{report['id']}/return/", {"comment": "too late"}, format="json"
        )
        assert response.status_code == 409

    def test_submitted_report_body_is_read_only(self, env):
        report = create_report(env).json()
        page_id = report["page"]
        project_pages = Page.objects.get(pk=page_id)
        project_id = str(project_pages.projects.first().id)
        page_url = f"/api/workspaces/{env['workspace'].slug}/projects/{project_id}/pages/{page_id}/"

        editable = env["student_client"].patch(
            page_url, {"description_html": "<p>Draft body</p>"}, format="json"
        )
        assert editable.status_code == 200

        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        blocked = env["student_client"].patch(
            page_url, {"description_html": "<p>Edited after submit</p>"}, format="json"
        )
        assert blocked.status_code == 403
        assert blocked.json()["error_code"] == "report_read_only"

    def test_reported_page_cannot_be_deleted_directly(self, env):
        report = create_report(env).json()
        page = Page.objects.get(pk=report["page"])
        project_id = str(page.projects.first().id)
        page_url = (
            f"/api/workspaces/{env['workspace'].slug}/projects/{project_id}/pages/{report['page']}/"
        )
        response = env["student_client"].delete(page_url)
        assert response.status_code == 403


@pytest.mark.django_db
class TestReportAccessControl:
    def test_visibility_filters_the_list_for_each_subject(self, env):
        private = create_report(env, visibility="PRIVATE", period_key="2026-W10").json()
        advised = create_report(env, visibility="DIRECT_ADVISOR", period_key="2026-W11").json()
        assert private["visibility"] == "PRIVATE"
        assert advised["visibility"] == "DIRECT_ADVISOR"

        owner_list = env["student_client"].get(env["url"]).json()
        assert owner_list["count"] == 2

        advisor_list = env["advisor_client"].get(env["url"]).json()
        assert {item["id"] for item in advisor_list["results"]} == {advised["id"]}

        colleague_list = env["colleague_client"].get(env["url"]).json()
        assert colleague_list["count"] == 0

        admin_list = env["admin_client"].get(env["url"]).json()
        assert admin_list["count"] == 2

    def test_unit_visibility_is_available_when_the_policy_allows_it(self, env):
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/settings/",
            {"default_report_visibility": "UNIT"},
            format="json",
        )
        unit = create_report(env, visibility="UNIT", period_key="2026-W12").json()
        assert unit["visibility"] == "UNIT"
        # a member of the same organisation node now sees the report
        colleague_list = env["colleague_client"].get(env["url"]).json()
        assert {item["id"] for item in colleague_list["results"]} == {unit["id"]}

    def test_direct_advisor_scope_default(self, env):
        report = create_report(env).json()
        advisor_list = env["advisor_client"].get(env["url"]).json()
        assert {item["id"] for item in advisor_list["results"]} == {report["id"]}

    def test_detail_is_hidden_from_unauthorised_member(self, env):
        private = create_report(env, visibility="PRIVATE").json()
        response = env["colleague_client"].get(f"{env['url']}{private['id']}/")
        assert response.status_code == 404

    def test_author_can_narrow_but_not_widen(self, env):
        report = create_report(env).json()
        access_url = f"{env['url']}{report['id']}/access/"

        widened = env["student_client"].patch(access_url, {"visibility": "WORKSPACE"}, format="json")
        assert widened.status_code == 422

        narrowed = env["student_client"].patch(access_url, {"visibility": "PRIVATE"}, format="json")
        assert narrowed.status_code == 200
        assert narrowed.json()["visibility"] == "PRIVATE"
        assert narrowed.json()["can_widen"] is False

    def test_custom_grants_extend_within_the_default_boundary(self, env):
        report = create_report(env).json()
        access_url = f"{env['url']}{report['id']}/access/"
        response = env["student_client"].patch(
            access_url,
            {"grants": [{"grantee_user": str(env["colleague"].id)}]},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["visibility"] == "CUSTOM"
        assert ReportAccessGrant.objects.filter(report_id=report["id"], is_revoked=False).count() == 1

        colleague_list = env["colleague_client"].get(env["url"]).json()
        assert {item["id"] for item in colleague_list["results"]} == {report["id"]}

    def test_private_reports_reject_custom_grants(self, env):
        report = create_report(env, visibility="PRIVATE").json()
        response = env["student_client"].patch(
            f"{env['url']}{report['id']}/access/",
            {"grants": [{"grantee_user": str(env["colleague"].id)}]},
            format="json",
        )
        assert response.status_code == 422

    def test_reviewer_cannot_change_visibility(self, env):
        report = create_report(env).json()
        response = env["advisor_client"].patch(
            f"{env['url']}{report['id']}/access/", {"visibility": "PRIVATE"}, format="json"
        )
        assert response.status_code == 404
