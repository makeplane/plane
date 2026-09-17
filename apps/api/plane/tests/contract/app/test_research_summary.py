# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient

from plane.db.models import MentorBinding, Notification, OrgUnit, OrgUnitMember, PeriodicReport
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_instance_admin,
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
    make_instance_admin(admin)
    workspace = make_workspace(admin)
    enable_research(workspace)
    pi = make_user(first_name="Pi")
    student_one = make_user(first_name="StudentOne")
    student_two = make_user(first_name="StudentTwo")
    advisor = make_user(first_name="Advisor")
    for user in (pi, student_one, student_two, advisor):
        add_workspace_member(workspace, user)

    root = create_unit(workspace, "Root", None, OrgUnit.UnitType.ROOT)
    group = create_unit(workspace, "Group", root, OrgUnit.UnitType.GROUP)
    OrgUnitMember.objects.create(workspace=workspace, org_unit=group, user=pi, org_role=OrgUnitMember.OrgRole.PI)
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=group,
        user=student_one,
        org_role=OrgUnitMember.OrgRole.OWNER,
        is_primary=True,
    )
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=group,
        user=student_two,
        org_role=OrgUnitMember.OrgRole.OWNER,
        is_primary=True,
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=advisor, org_role=OrgUnitMember.OrgRole.ADVISOR
    )
    for student in (student_one, student_two):
        MentorBinding.objects.create(
            workspace=workspace,
            org_unit=group,
            mentee=student,
            mentor=advisor,
            is_primary_advisor=True,
        )

    for student in (student_one, student_two):
        client = client_for(student)
        client.post(
            f"/api/research/workspaces/{workspace.slug}/projects/",
            {"org_unit": str(group.id), "research_type": "PHD"},
            format="json",
        )

    return {
        "admin": admin,
        "pi": pi,
        "advisor": advisor,
        "student_one": student_one,
        "student_two": student_two,
        "workspace": workspace,
        "group": group,
        "admin_client": client_for(admin),
        "pi_client": client_for(pi),
        "advisor_client": client_for(advisor),
        "student_one_client": client_for(student_one),
        "student_two_client": client_for(student_two),
        "reports_url": f"/api/research/workspaces/{workspace.slug}/reports/",
        "summary_url": f"/api/research/workspaces/{workspace.slug}/reports/summary/",
    }


def create_report(env, client, period_key="2026-W38"):
    return client.post(
        env["reports_url"],
        {"report_type": "WEEKLY", "period_key": period_key},
        format="json",
    ).json()


@pytest.mark.django_db
class TestReportSummary:
    def test_counts_match_the_detail_list(self, env):
        report = create_report(env, env["student_one_client"])
        env["student_one_client"].post(f"{env['reports_url']}{report['id']}/submit/", {}, format="json")

        summary = env["pi_client"].get(f"{env['summary_url']}?period_key=2026-W38").json()
        assert summary["period_key"] == "2026-W38"
        assert summary["by_unit"][0]["org_unit_name"] == "Group"
        counts = summary["counts"]
        assert counts["submitted"] == 1
        assert counts["not_submitted"] == 1  # student two has no report yet

        listing = env["pi_client"].get(f"{env['reports_url']}?period_key=2026-W38").json()
        assert listing["count"] == counts["draft"] + counts["submitted"] + counts["needs_revision"] + counts["accepted"]

    def test_pending_members_are_listed(self, env):
        summary = env["pi_client"].get(f"{env['summary_url']}?period_key=2026-W38").json()
        pending_emails = {member["email"] for member in summary["pending_members"]}
        assert env["student_two"].email in pending_emails
        assert env["student_one"].email in pending_emails
        assert summary["counts"]["not_submitted"] == 2

    def test_admin_sees_every_node(self, env):
        summary = env["admin_client"].get(f"{env['summary_url']}?period_key=2026-W38").json()
        # only the top-most node is aggregated, its subtree covers the group
        assert {entry["org_unit_name"] for entry in summary["by_unit"]} == {"Root"}
        assert summary["counts"]["not_submitted"] == 2

    def test_analyst_without_scope_sees_nothing(self, env):
        """A mentor bound to a student still aggregates nothing of their own.

        v2.5.0 puts the summary behind the mentor tier, so the analyst reaches
        the page through a mentoring relation instead of a node seat while
        staying outside every aggregation scope.
        """
        stranger = make_user()
        add_workspace_member(env["workspace"], stranger)
        MentorBinding.objects.create(workspace=env["workspace"], mentor=stranger, mentee=env["student_one"])
        summary = client_for(stranger).get(f"{env['summary_url']}?period_key=2026-W38").json()
        assert summary["by_unit"] == []
        assert summary["counts"]["not_submitted"] == 0

    def test_cannot_aggregate_an_out_of_scope_node(self, env):
        other_root = create_unit(env["workspace"], "Other root", None, OrgUnit.UnitType.TEAM)
        OrgUnitMember.objects.create(
            workspace=env["workspace"],
            org_unit=other_root,
            user=make_user(),
            org_role=OrgUnitMember.OrgRole.OWNER,
        )
        response = env["pi_client"].get(f"{env['summary_url']}?period_key=2026-W38&org_unit={other_root.id}")
        assert response.status_code == 403

    def test_invalid_period_is_rejected(self, env):
        response = env["pi_client"].get(f"{env['summary_url']}?period_key=2026-99")
        assert response.status_code == 400


@pytest.mark.django_db
class TestReportNotifications:
    def test_submission_notifies_reviewers(self, env):
        report = create_report(env, env["student_one_client"])
        Notification.objects.all().delete()
        env["student_one_client"].post(f"{env['reports_url']}{report['id']}/submit/", {}, format="json")

        notifications = Notification.objects.filter(entity_name="research_report")
        assert notifications.count() >= 2  # principal investigator + advisor
        receivers = {item.receiver_id for item in notifications}
        assert env["pi"].id in receivers
        assert env["advisor"].id in receivers
        assert env["student_one"].id not in receivers
        assert all(item.data["period_key"] == "2026-W38" for item in notifications)

    def test_return_and_accept_notify_the_author(self, env):
        report = create_report(env, env["student_one_client"])
        env["student_one_client"].post(f"{env['reports_url']}{report['id']}/submit/", {}, format="json")
        Notification.objects.all().delete()

        env["pi_client"].post(f"{env['reports_url']}{report['id']}/return/", {"comment": "补充数据"}, format="json")
        returned = Notification.objects.filter(entity_name="research_report")
        assert returned.count() == 1
        assert returned.first().receiver_id == env["student_one"].id
        assert returned.first().message["comment"] == "补充数据"

        Notification.objects.all().delete()
        env["student_one_client"].post(f"{env['reports_url']}{report['id']}/submit/", {}, format="json")
        env["pi_client"].post(f"{env['reports_url']}{report['id']}/accept/", {}, format="json")
        accepted = Notification.objects.filter(entity_name="research_report", receiver_id=env["student_one"].id)
        assert accepted.count() == 1
        assert accepted.first().message["action"] == "accepted"

    def test_notifications_do_not_touch_existing_issue_notifications(self, env):
        report = create_report(env, env["student_one_client"])
        env["student_one_client"].post(f"{env['reports_url']}{report['id']}/submit/", {}, format="json")
        assert Notification.objects.filter(entity_name="issue").count() == 0
        assert PeriodicReport.objects.count() == 1
