# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from time import sleep
from unittest.mock import patch

import pytest
from django.db import close_old_connections
from rest_framework.test import APIClient

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    Page,
    PeriodicReport,
    PeriodicReportSnapshot,
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
        workspace=workspace,
        org_unit=group,
        user=student,
        org_role=OrgUnitMember.OrgRole.OWNER,
        is_primary=True,
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=advisor, org_role=OrgUnitMember.OrgRole.ADVISOR
    )
    MentorBinding.objects.create(
        workspace=workspace,
        org_unit=group,
        mentee=student,
        mentor=advisor,
        is_primary_advisor=True,
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=colleague, org_role=OrgUnitMember.OrgRole.REVIEWER
    )

    student_client = client_for(student)
    # every research owner needs an active project before creating reports
    student_client.post(
        f"/api/research/workspaces/{workspace.slug}/projects/",
        {"org_unit": str(group.id), "research_type": "PHD"},
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

    def test_creation_requires_an_effective_primary_org_assignment(self, env):
        # the admin has neither a cultivation project nor a primary org assignment
        response = env["admin_client"].post(
            env["url"], {"report_type": "WEEKLY", "period_key": "2026-W39"}, format="json"
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "research_project_not_found"

    def test_primary_org_member_can_create_and_edit_a_report_without_any_project(self, env):
        member = make_user(first_name="Standalone", email="standalone@example.com")
        add_workspace_member(env["workspace"], member)
        OrgUnitMember.objects.create(
            workspace=env["workspace"],
            org_unit=env["group"],
            user=member,
            org_role=OrgUnitMember.OrgRole.REVIEWER,
            is_primary=True,
        )
        client = client_for(member)

        created = client.post(
            env["url"],
            {"report_type": "WEEKLY", "period_key": "2026-W39"},
            format="json",
        )

        assert created.status_code == 201
        payload = created.json()
        assert payload["project"] is None
        assert payload["page_project"] is None
        assert payload["org_unit"] == str(env["group"].id)
        page = Page.objects.get(pk=payload["page"])
        assert page.project_pages.filter(deleted_at__isnull=True).count() == 0

        updated = client.patch(
            f"{env['url']}{payload['id']}/",
            {
                "description_json": {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Progress"}]}],
                },
                "description_html": "<p>Progress</p>",
            },
            format="json",
        )

        assert updated.status_code == 200
        assert updated.json()["draft_content"]["description_html"] == "<p>Progress</p>"
        page.refresh_from_db()
        assert page.description_html == "<p>Progress</p>"

        submitted = client.post(f"{env['url']}{payload['id']}/submit/", {}, format="json")
        assert submitted.status_code == 200
        assert submitted.json()["project"] is None
        assert PeriodicReportSnapshot.objects.get(report_id=payload["id"]).description_html == "<p>Progress</p>"

        duplicate = client.post(
            env["url"],
            {"report_type": "WEEKLY", "period_key": "2026-W39"},
            format="json",
        )
        assert duplicate.status_code == 409


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
        response = env["advisor_client"].post(f"{env['url']}{report['id']}/return/", {"comment": ""}, format="json")
        assert response.status_code == 422
        assert response.json()["error_code"] == "report_return_reason_required"

    def test_only_the_owner_can_submit(self, env):
        report = create_report(env).json()
        response = env["advisor_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        assert response.status_code == 404

    def test_submit_captures_an_immutable_official_snapshot(self, env):
        report = create_report(env).json()
        page = Page.objects.get(pk=report["page"])
        page.description_json = {"type": "doc", "content": [{"type": "paragraph"}]}
        page.description_html = "<p>Official version</p>"
        page.save()

        submitted = env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")

        assert submitted.status_code == 200
        snapshot = PeriodicReportSnapshot.objects.get(report_id=report["id"], version_no=1)
        assert snapshot.description_html == "<p>Official version</p>"
        assert submitted.json()["latest_official_version"] == 1

    def test_report_without_org_assignment_cannot_be_submitted(self, env):
        report = create_report(env).json()
        PeriodicReport.objects.filter(pk=report["id"]).update(org_unit=None)

        response = env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")

        assert response.status_code == 422
        assert response.json()["error_code"] == "org_unit_not_found"

    def test_reviewer_keeps_reading_last_snapshot_while_author_revises(self, env):
        report = create_report(env).json()
        page = Page.objects.get(pk=report["page"])
        page.description_html = "<p>Submitted v1</p>"
        page.save()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        env["advisor_client"].post(
            f"{env['url']}{report['id']}/return/",
            {"comment": "revise"},
            format="json",
        )
        page.description_html = "<p>Private revision</p>"
        page.save()

        advisor_detail = env["advisor_client"].get(f"{env['url']}{report['id']}/")

        assert advisor_detail.status_code == 200
        assert advisor_detail.json()["official_content"]["description_html"] == "<p>Submitted v1</p>"
        assert advisor_detail.json()["draft_content"] is None

    def test_admin_cannot_read_another_members_draft(self, env):
        report = create_report(env).json()
        response = env["admin_client"].get(f"{env['url']}{report['id']}/")
        assert response.status_code == 404

    def test_colleague_cannot_review(self, env):
        report = create_report(env).json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        response = env["colleague_client"].post(f"{env['url']}{report['id']}/accept/", {}, format="json")
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

        editable = env["student_client"].patch(page_url, {"description_html": "<p>Draft body</p>"}, format="json")
        assert editable.status_code == 200

        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        blocked = env["student_client"].patch(
            page_url, {"description_html": "<p>Edited after submit</p>"}, format="json"
        )
        assert blocked.status_code == 403
        assert blocked.json()["error_code"] == "report_read_only"

    def test_author_can_open_draft_page_but_advisor_cannot(self, env):
        report = create_report(env).json()
        page = Page.objects.get(pk=report["page"])
        project_id = str(page.projects.first().id)
        page_url = f"/api/workspaces/{env['workspace'].slug}/projects/{project_id}/pages/{report['page']}/"

        assert env["student_client"].get(page_url).status_code == 200
        assert env["advisor_client"].get(page_url).status_code == 403

    def test_submitted_report_binary_description_is_read_only(self, env):
        report = create_report(env).json()
        page_id = report["page"]
        page = Page.objects.get(pk=page_id)
        project_id = str(page.projects.first().id)
        description_url = f"/api/workspaces/{env['workspace'].slug}/projects/{project_id}/pages/{page_id}/description/"

        editable = env["student_client"].patch(
            description_url, {"description_html": "<p>Draft body</p>"}, format="json"
        )
        assert editable.status_code == 200

        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        blocked = env["student_client"].patch(
            description_url,
            {"description_html": "<p>Edited after submit</p>"},
            format="json",
        )

        assert blocked.status_code == 403
        assert blocked.json()["error_code"] == "report_read_only"

    def test_reported_page_cannot_be_deleted_directly(self, env):
        report = create_report(env).json()
        page = Page.objects.get(pk=report["page"])
        project_id = str(page.projects.first().id)
        page_url = f"/api/workspaces/{env['workspace'].slug}/projects/{project_id}/pages/{report['page']}/"
        response = env["student_client"].delete(page_url)
        assert response.status_code == 403


@pytest.mark.django_db(transaction=True)
class TestReportConcurrentStateFlow:
    @staticmethod
    def _run_together(*operations):
        barrier = Barrier(len(operations))

        def execute(operation):
            close_old_connections()
            try:
                barrier.wait(timeout=5)
                return operation().status_code
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=len(operations)) as executor:
            return list(executor.map(execute, operations))

    def test_concurrent_submit_creates_one_official_version(self, env):
        from plane.research.views import reports as report_views

        report = create_report(env).json()
        submit_url = f"{env['url']}{report['id']}/submit/"
        create_snapshot = report_views.create_report_snapshot

        def delayed_snapshot(*args, **kwargs):
            sleep(0.15)
            return create_snapshot(*args, **kwargs)

        with patch.object(report_views, "create_report_snapshot", side_effect=delayed_snapshot):
            statuses = self._run_together(
                lambda: client_for(env["student"]).post(submit_url, {}, format="json"),
                lambda: client_for(env["student"]).post(submit_url, {}, format="json"),
            )

        assert sorted(statuses) == [200, 409]
        assert PeriodicReportSnapshot.objects.filter(report_id=report["id"]).count() == 1
        assert ReportReviewLog.objects.filter(report_id=report["id"], action=ReportReviewLog.Action.SUBMIT).count() == 1

    def test_return_and_accept_compete_on_one_submitted_state(self, env):
        from plane.research.views import reports as report_views

        report = create_report(env).json()
        report_url = f"{env['url']}{report['id']}/"
        submitted = env["student_client"].post(f"{report_url}submit/", {}, format="json")
        assert submitted.status_code == 200
        transition_allowed = report_views.can_transition

        def delayed_transition(current, target):
            result = transition_allowed(current, target)
            if current == PeriodicReport.Status.SUBMITTED:
                sleep(0.15)
            return result

        with patch.object(report_views, "can_transition", side_effect=delayed_transition):
            statuses = self._run_together(
                lambda: client_for(env["advisor"]).post(
                    f"{report_url}return/",
                    {"comment": "revise"},
                    format="json",
                ),
                lambda: client_for(env["advisor"]).post(f"{report_url}accept/", {}, format="json"),
            )

        assert sorted(statuses) == [200, 409]
        assert (
            ReportReviewLog.objects.filter(
                report_id=report["id"],
                action__in=(ReportReviewLog.Action.RETURN, ReportReviewLog.Action.ACCEPT),
            ).count()
            == 1
        )


@pytest.mark.django_db
class TestReportAccessControl:
    @pytest.mark.parametrize(
        "params",
        [
            {"owner": "not-a-uuid"},
            {"org_unit": "not-a-uuid"},
            {"date_from": "not-a-date"},
            {"date_from": "2026-10-01", "date_to": "2026-09-01"},
            {"per_page": "0"},
            {"per_page": "not-an-integer"},
            {"cursor": "not-a-cursor"},
        ],
    )
    def test_list_rejects_invalid_filter_and_pagination_values(self, env, params):
        response = env["student_client"].get(env["url"], params)
        assert response.status_code == 400

    def test_list_filters_visibility_in_sql_before_pagination(self, env, mocker):
        report = create_report(env, period_key="2026-W09").json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        object_acl = mocker.patch(
            "plane.research.views.reports.check_access",
            side_effect=AssertionError("report list must not scan objects through Python ACL"),
        )

        response = env["advisor_client"].get(env["url"], {"per_page": "1"})

        assert response.status_code == 200
        assert response.data["per_page"] == 1
        assert response.data["total_results"] == 1
        assert object_acl.call_count == 0

    def test_visibility_filters_the_list_for_each_subject(self, env):
        private = create_report(env, visibility="PRIVATE", period_key="2026-W10").json()
        advised = create_report(env, visibility="DIRECT_ADVISOR", period_key="2026-W11").json()
        assert private["visibility"] == "PRIVATE"
        assert advised["visibility"] == "DIRECT_ADVISOR"

        owner_list = env["student_client"].get(env["url"]).json()
        assert owner_list["count"] == 2

        env["student_client"].post(f"{env['url']}{advised['id']}/submit/", {}, format="json")
        advisor_list = env["advisor_client"].get(env["url"]).json()
        assert {item["id"] for item in advisor_list["results"]} == {advised["id"]}

        colleague_list = env["colleague_client"].get(env["url"]).json()
        assert colleague_list["count"] == 0

        admin_list = env["admin_client"].get(env["url"]).json()
        assert admin_list["count"] == 0

    def test_unit_visibility_is_available_when_the_policy_allows_it(self, env):
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/settings/",
            {"default_report_visibility": "UNIT"},
            format="json",
        )
        unit = create_report(env, visibility="UNIT", period_key="2026-W12").json()
        assert unit["visibility"] == "UNIT"
        env["student_client"].post(f"{env['url']}{unit['id']}/submit/", {}, format="json")
        # a member of the same organisation node now sees the report
        colleague_list = env["colleague_client"].get(env["url"]).json()
        assert {item["id"] for item in colleague_list["results"]} == {unit["id"]}

    def test_direct_advisor_scope_default(self, env):
        report = create_report(env).json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")
        advisor_list = env["advisor_client"].get(env["url"]).json()
        assert {item["id"] for item in advisor_list["results"]} == {report["id"]}

    def test_joint_advisor_reads_formal_report_but_cannot_review_it(self, env):
        joint = make_user(first_name="JointAdvisor", email="joint@example.com")
        add_workspace_member(env["workspace"], joint)
        MentorBinding.objects.create(
            workspace=env["workspace"],
            org_unit=env["group"],
            mentee=env["student"],
            mentor=joint,
            is_primary_advisor=False,
        )
        report = create_report(env, period_key="2026-W13").json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")

        detail = client_for(joint).get(f"{env['url']}{report['id']}/")
        assert detail.status_code == 200
        assert detail.json()["can_review"] is False
        denied = client_for(joint).post(
            f"{env['url']}{report['id']}/return/",
            {"comment": "joint advisor cannot return"},
            format="json",
        )
        assert denied.status_code == 403

    def test_same_unit_advisor_without_binding_cannot_read_formal_report(self, env):
        unbound = make_user(first_name="UnboundAdvisor", email="unbound@example.com")
        add_workspace_member(env["workspace"], unbound)
        OrgUnitMember.objects.create(
            workspace=env["workspace"],
            org_unit=env["group"],
            user=unbound,
            org_role=OrgUnitMember.OrgRole.ADVISOR,
        )
        report = create_report(env, period_key="2026-W14").json()
        env["student_client"].post(f"{env['url']}{report['id']}/submit/", {}, format="json")

        assert client_for(unbound).get(f"{env['url']}{report['id']}/").status_code == 404

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

    def test_custom_grants_cannot_expand_a_direct_advisor_policy_to_a_colleague(self, env):
        report = create_report(env).json()
        access_url = f"{env['url']}{report['id']}/access/"
        response = env["student_client"].patch(
            access_url,
            {"grants": [{"grantee_user": str(env["colleague"].id)}]},
            format="json",
        )
        assert response.status_code == 422
        assert ReportAccessGrant.objects.filter(report_id=report["id"], is_revoked=False).count() == 0

    def test_custom_grant_can_select_an_existing_direct_advisor(self, env):
        report = create_report(env).json()
        response = env["student_client"].patch(
            f"{env['url']}{report['id']}/access/",
            {"grants": [{"grantee_user": str(env["advisor"].id)}]},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["visibility"] == "CUSTOM"

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
