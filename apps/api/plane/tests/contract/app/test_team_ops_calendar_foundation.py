# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Team Ops work calendar foundation: teams, policy, holidays, audit history and the access rules."""

from datetime import date, timedelta

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import WorkspaceMember
from plane.team_ops.models import (
    AuditIsAppendOnly,
    CalendarAudit,
    CalendarHoliday,
    CalendarSettings,
    OpsTeam,
    OpsTeamMember,
)
from plane.team_ops.services.audit import record_audit
from plane.team_ops.services.access import CalendarAccess
from plane.tests.contract.app.team_ops_support import (
    ADMIN,
    GUEST,
    MEMBER,
    _no_broker,
    admin,
    admin_client,
    cal,
    colleague,
    guest,
    guest_client,
    join,
    lead,
    lead_client,
    make_client,
    make_team,
    make_user,
    make_workspace,
    member,
    member_client,
    other_workspace,
    outsider,
    outsider_client,
    today,
    url,
    workspace,
)


def set_policy(workspace, **fields):
    row, _ = CalendarSettings.objects.get_or_create(workspace=workspace)
    for name, value in fields.items():
        setattr(row, name, value)
    row.save()
    return row


@pytest.mark.contract
class TestTeams:
    @pytest.mark.django_db
    def test_admin_creates_team_with_members_and_it_is_audited(self, admin_client, workspace, admin, member, lead):
        response = admin_client.post(
            url(workspace, "teams/"),
            {
                "name": "Platform",
                "description": "Core services",
                "members": [{"user": str(lead.id), "role": "LEAD"}, {"user": str(member.id)}],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Platform"
        assert [(str(m["user"]), m["role"]) for m in response.data["members"]] == [
            (str(lead.id), "LEAD"),
            (str(member.id), "MEMBER"),
        ]
        team = OpsTeam.objects.get(pk=response.data["id"])
        assert team.workspace == workspace

        audit = CalendarAudit.objects.get(workspace=workspace, entity="TEAM")
        assert audit.action == "CREATE"
        assert audit.changed_by == admin
        assert audit.subject_user is None
        assert audit.new_value["name"] == "Platform"
        assert len(audit.new_value["members"]) == 2

    @pytest.mark.django_db
    def test_members_and_admins_can_list_but_guests_and_outsiders_cannot(
        self, admin_client, member_client, guest_client, outsider_client, workspace, member
    ):
        make_team(workspace, "Platform", members=[member])

        for client in (admin_client, member_client):
            response = client.get(url(workspace, "teams/"))
            assert response.status_code == status.HTTP_200_OK
            assert [team["name"] for team in response.data] == ["Platform"]
        assert guest_client.get(url(workspace, "teams/")).status_code == status.HTTP_403_FORBIDDEN
        assert outsider_client.get(url(workspace, "teams/")).status_code == status.HTTP_403_FORBIDDEN
        assert APIClient().get(url(workspace, "teams/")).status_code in (401, 403)

    @pytest.mark.django_db
    @pytest.mark.parametrize("client_name", ["member_client", "lead_client", "guest_client", "outsider_client"])
    def test_only_admins_can_write_teams(self, request, workspace, member, client_name):
        client = request.getfixturevalue(client_name)
        team = make_team(workspace, "Platform")

        assert client.post(url(workspace, "teams/"), {"name": "New"}, format="json").status_code == 403
        assert client.patch(url(workspace, f"teams/{team.id}/"), {"name": "X"}, format="json").status_code == 403
        assert client.delete(url(workspace, f"teams/{team.id}/")).status_code == 403
        team.refresh_from_db()
        assert team.name == "Platform"
        assert not CalendarAudit.objects.exists()

    @pytest.mark.django_db
    def test_team_names_are_unique_per_workspace_ignoring_case(self, admin_client, workspace, other_workspace):
        make_team(workspace, "Platform")
        make_team(other_workspace, "Design")

        assert admin_client.post(url(workspace, "teams/"), {"name": "platform"}, format="json").status_code == 400
        # The same name in another workspace is a different team.
        assert OpsTeam.objects.filter(name="Design").count() == 1
        assert admin_client.post(url(workspace, "teams/"), {"name": "Design"}, format="json").status_code == 201

    @pytest.mark.django_db
    def test_team_members_must_be_active_workspace_admins_or_members(
        self, admin_client, workspace, guest, outsider, member
    ):
        for user in (guest, outsider):
            response = admin_client.post(
                url(workspace, "teams/"), {"name": "T", "members": [{"user": str(user.id)}]}, format="json"
            )
            assert response.status_code == 400, user

        removed = make_user("removed")
        join(workspace, removed, MEMBER)
        WorkspaceMember.objects.filter(workspace=workspace, member=removed).update(is_active=False)
        response = admin_client.post(
            url(workspace, "teams/"), {"name": "T", "members": [{"user": str(removed.id)}]}, format="json"
        )
        assert response.status_code == 400
        assert not OpsTeam.objects.filter(workspace=workspace).exists()

    @pytest.mark.django_db
    def test_duplicate_member_and_bad_role_are_rejected(self, admin_client, workspace, member):
        duplicate = {"name": "T", "members": [{"user": str(member.id)}, {"user": str(member.id), "role": "LEAD"}]}
        assert admin_client.post(url(workspace, "teams/"), duplicate, format="json").status_code == 400
        bad_role = {"name": "T", "members": [{"user": str(member.id), "role": "BOSS"}]}
        assert admin_client.post(url(workspace, "teams/"), bad_role, format="json").status_code == 400
        assert admin_client.post(url(workspace, "teams/"), {"name": "   "}, format="json").status_code == 400

    @pytest.mark.django_db
    def test_patch_renames_and_replaces_members_and_audits_before_and_after(
        self, admin_client, workspace, member, colleague, lead
    ):
        team = make_team(workspace, "Platform", leads=[lead], members=[member])

        response = admin_client.patch(
            url(workspace, f"teams/{team.id}/"),
            {
                "name": "Platform & Infra",
                "members": [{"user": str(member.id), "role": "LEAD"}, {"user": str(colleague.id)}],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        roles = {str(m["user"]): m["role"] for m in response.data["members"]}
        assert roles == {str(member.id): "LEAD", str(colleague.id): "MEMBER"}
        assert not OpsTeamMember.objects.filter(team=team, user=lead).exists()

        audit = CalendarAudit.objects.get(entity="TEAM", action="UPDATE")
        assert audit.old_value["name"] == "Platform"
        assert audit.new_value["name"] == "Platform & Infra"
        assert {m["user"] for m in audit.old_value["members"]} == {str(lead.id), str(member.id)}
        assert {m["user"] for m in audit.new_value["members"]} == {str(member.id), str(colleague.id)}

    @pytest.mark.django_db
    def test_patch_without_changes_writes_no_audit_and_keeps_members(self, admin_client, workspace, member):
        team = make_team(workspace, "Platform", members=[member])

        response = admin_client.patch(url(workspace, f"teams/{team.id}/"), {"name": "Platform"}, format="json")

        assert response.status_code == 200
        assert OpsTeamMember.objects.filter(team=team, user=member).exists()
        assert not CalendarAudit.objects.exists()

    @pytest.mark.django_db
    def test_patch_cannot_take_another_teams_name(self, admin_client, workspace):
        make_team(workspace, "Platform")
        other = make_team(workspace, "Design")

        response = admin_client.patch(url(workspace, f"teams/{other.id}/"), {"name": "Platform"}, format="json")

        assert response.status_code == 400

    @pytest.mark.django_db
    def test_delete_removes_team_and_members_and_keeps_history(self, admin_client, workspace, member):
        team = make_team(workspace, "Platform", members=[member])

        response = admin_client.delete(url(workspace, f"teams/{team.id}/"))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not OpsTeam.objects.filter(pk=team.id).exists()
        assert not OpsTeamMember.objects.filter(team_id=team.id).exists()
        audit = CalendarAudit.objects.get(entity="TEAM", action="DELETE")
        assert audit.old_value["name"] == "Platform"
        # A deleted team's name can be used again.
        assert admin_client.post(url(workspace, "teams/"), {"name": "Platform"}, format="json").status_code == 201

    @pytest.mark.django_db
    def test_other_workspace_teams_are_invisible_and_untouchable(self, admin_client, workspace, other_workspace):
        foreign = make_team(other_workspace, "Foreign")

        assert admin_client.get(url(workspace, "teams/")).data == []
        assert admin_client.get(url(workspace, f"teams/{foreign.id}/")).status_code == 404
        assert (
            admin_client.patch(url(workspace, f"teams/{foreign.id}/"), {"name": "X"}, format="json").status_code == 404
        )
        assert admin_client.delete(url(workspace, f"teams/{foreign.id}/")).status_code == 404
        assert OpsTeam.objects.filter(pk=foreign.id).exists()

    @pytest.mark.django_db
    def test_members_who_left_the_workspace_are_not_listed(self, admin_client, workspace, member, colleague):
        make_team(workspace, "Platform", members=[member, colleague])
        WorkspaceMember.objects.filter(workspace=workspace, member=colleague).update(is_active=False)

        response = admin_client.get(url(workspace, "teams/"))

        assert [str(m["user"]) for m in response.data[0]["members"]] == [str(member.id)]


@pytest.mark.contract
class TestCalendarSettings:
    @pytest.mark.django_db
    def test_defaults_are_created_on_first_read(self, admin_client, workspace):
        assert not CalendarSettings.objects.filter(workspace=workspace).exists()

        response = admin_client.get(cal(workspace, "settings/"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["settings"] == {
            "team_view_access": "ADMINS_AND_LEADS",
            "edit_others_access": "ADMINS",
            "member_edit_past_days": 0,
            "working_weekdays": [1, 2, 3, 4, 5],
            "template_horizon_weeks": 8,
        }
        assert CalendarSettings.objects.filter(workspace=workspace).count() == 1

    @pytest.mark.django_db
    def test_effective_permissions_per_role(self, admin_client, member_client, lead_client, workspace, lead):
        make_team(workspace, "Platform", leads=[lead])

        admin_permissions = admin_client.get(cal(workspace, "settings/")).data["permissions"]
        assert admin_permissions["is_admin"] and admin_permissions["can_manage"]
        assert admin_permissions["can_view_team"] and admin_permissions["can_edit_others"]
        assert admin_permissions["earliest_editable_date"] is None

        lead_permissions = lead_client.get(cal(workspace, "settings/")).data["permissions"]
        assert lead_permissions["is_lead"] and lead_permissions["can_view_team"]
        assert not lead_permissions["can_manage"] and not lead_permissions["can_edit_others"]
        assert lead_permissions["earliest_editable_date"] == today().isoformat()

        member_permissions = member_client.get(cal(workspace, "settings/")).data["permissions"]
        assert not member_permissions["is_lead"] and not member_permissions["can_view_team"]
        assert not member_permissions["can_edit_others"]

    @pytest.mark.django_db
    def test_guest_outsider_and_anonymous_cannot_read(self, guest_client, outsider_client, workspace):
        assert guest_client.get(cal(workspace, "settings/")).status_code == 403
        assert outsider_client.get(cal(workspace, "settings/")).status_code == 403
        assert APIClient().get(cal(workspace, "settings/")).status_code in (401, 403)

    @pytest.mark.django_db
    def test_admin_updates_policy_and_only_changed_fields_are_audited(self, admin_client, workspace, admin):
        response = admin_client.put(
            cal(workspace, "settings/"),
            {
                "team_view_access": "ALL_MEMBERS",
                "member_edit_past_days": 3,
                "working_weekdays": [5, 1, 2, 3, 4, 1],
                "edit_others_access": "ADMINS",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["settings"]["team_view_access"] == "ALL_MEMBERS"
        assert response.data["settings"]["working_weekdays"] == [1, 2, 3, 4, 5]
        # Fields that were not sent keep their value.
        assert response.data["settings"]["template_horizon_weeks"] == 8

        audit = CalendarAudit.objects.get(workspace=workspace, entity="SETTINGS")
        assert audit.action == "UPDATE" and audit.changed_by == admin
        assert audit.old_value == {"team_view_access": "ADMINS_AND_LEADS", "member_edit_past_days": 0}
        assert audit.new_value == {"team_view_access": "ALL_MEMBERS", "member_edit_past_days": 3}

    @pytest.mark.django_db
    def test_saving_the_same_values_writes_no_audit(self, admin_client, workspace):
        admin_client.get(cal(workspace, "settings/"))

        response = admin_client.put(cal(workspace, "settings/"), {"member_edit_past_days": 0}, format="json")

        assert response.status_code == 200
        assert not CalendarAudit.objects.exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("client_name", ["member_client", "lead_client", "guest_client", "outsider_client"])
    def test_only_admins_can_change_policy(self, request, workspace, client_name):
        client = request.getfixturevalue(client_name)

        response = client.put(cal(workspace, "settings/"), {"team_view_access": "ALL_MEMBERS"}, format="json")

        assert response.status_code == 403
        assert not CalendarSettings.objects.filter(workspace=workspace, team_view_access="ALL_MEMBERS").exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "payload",
        [
            {"team_view_access": "EVERYONE"},
            {"edit_others_access": "ROOT"},
            {"member_edit_past_days": -1},
            {"member_edit_past_days": 400},
            {"working_weekdays": []},
            {"working_weekdays": [0, 1]},
            {"working_weekdays": [8]},
            {"template_horizon_weeks": 0},
            {"template_horizon_weeks": 27},
        ],
    )
    def test_invalid_policy_values_are_rejected(self, admin_client, workspace, payload):
        response = admin_client.put(cal(workspace, "settings/"), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not CalendarAudit.objects.exists()

    @pytest.mark.django_db
    def test_policy_is_per_workspace(self, admin_client, workspace, other_workspace):
        admin_client.put(cal(workspace, "settings/"), {"team_view_access": "ALL_MEMBERS"}, format="json")

        assert (
            CalendarSettings.objects.get_or_create(workspace=other_workspace)[0].team_view_access == "ADMINS_AND_LEADS"
        )
        # An admin of one workspace has no rights in the other.
        assert admin_client.get(cal(other_workspace, "settings/")).status_code == 403


@pytest.mark.contract
class TestHolidays:
    @pytest.mark.django_db
    def test_admin_adds_lists_and_deletes_a_holiday_with_audit(self, admin_client, member_client, workspace, admin):
        created = admin_client.post(
            cal(workspace, "holidays/"), {"date": "2027-01-01", "name": "New Year"}, format="json"
        )

        assert created.status_code == status.HTTP_201_CREATED
        assert created.data["date"] == "2027-01-01"
        listed = member_client.get(cal(workspace, "holidays/"))
        assert [(h["date"], h["name"]) for h in listed.data] == [("2027-01-01", "New Year")]
        audit = CalendarAudit.objects.get(entity="HOLIDAY", action="CREATE")
        assert audit.work_date == date(2027, 1, 1) and audit.changed_by == admin
        assert audit.new_value == {"date": "2027-01-01", "name": "New Year"}

        deleted = admin_client.delete(cal(workspace, f"holidays/{created.data['id']}/"))
        assert deleted.status_code == status.HTTP_204_NO_CONTENT
        assert not CalendarHoliday.objects.filter(workspace=workspace).exists()
        assert CalendarAudit.objects.filter(entity="HOLIDAY", action="DELETE").count() == 1
        # The date is free again.
        again = admin_client.post(cal(workspace, "holidays/"), {"date": "2027-01-01", "name": "Back"}, format="json")
        assert again.status_code == 201

    @pytest.mark.django_db
    def test_one_holiday_per_date(self, admin_client, workspace):
        admin_client.post(cal(workspace, "holidays/"), {"date": "2027-01-01", "name": "A"}, format="json")

        response = admin_client.post(cal(workspace, "holidays/"), {"date": "2027-01-01", "name": "B"}, format="json")

        assert response.status_code == 400
        assert CalendarHoliday.objects.filter(workspace=workspace).count() == 1

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "payload",
        [
            {"date": "not-a-date", "name": "X"},
            {"date": "2027-02-30", "name": "X"},
            {"date": "1999-12-31", "name": "X"},
            {"date": "2101-01-01", "name": "X"},
            {"date": "2027-01-01", "name": "   "},
            {"date": "2027-01-01"},
        ],
    )
    def test_invalid_holidays_are_rejected(self, admin_client, workspace, payload):
        assert admin_client.post(cal(workspace, "holidays/"), payload, format="json").status_code == 400

    @pytest.mark.django_db
    @pytest.mark.parametrize("client_name", ["member_client", "lead_client", "guest_client", "outsider_client"])
    def test_only_admins_can_write_holidays(self, request, workspace, client_name):
        client = request.getfixturevalue(client_name)
        holiday = CalendarHoliday.objects.create(workspace=workspace, date=date(2027, 1, 1), name="New Year")

        assert (
            client.post(cal(workspace, "holidays/"), {"date": "2027-01-02", "name": "X"}, format="json").status_code
            == 403
        )
        assert client.delete(cal(workspace, f"holidays/{holiday.id}/")).status_code == 403
        assert CalendarHoliday.objects.filter(workspace=workspace).count() == 1

    @pytest.mark.django_db
    def test_guests_and_outsiders_cannot_list(self, guest_client, outsider_client, workspace):
        assert guest_client.get(cal(workspace, "holidays/")).status_code == 403
        assert outsider_client.get(cal(workspace, "holidays/")).status_code == 403

    @pytest.mark.django_db
    def test_range_filter_and_validation(self, admin_client, workspace):
        for day, name in (("2027-01-01", "A"), ("2027-03-01", "B"), ("2027-06-01", "C")):
            CalendarHoliday.objects.create(workspace=workspace, date=date.fromisoformat(day), name=name)

        response = admin_client.get(cal(workspace, "holidays/?from=2027-02-01&to=2027-04-30"))
        assert [h["name"] for h in response.data] == ["B"]
        assert admin_client.get(cal(workspace, "holidays/?from=2027-05-01&to=2027-04-01")).status_code == 400
        assert admin_client.get(cal(workspace, "holidays/?from=2027-01-01&to=2029-01-01")).status_code == 400
        assert admin_client.get(cal(workspace, "holidays/?from=yesterday")).status_code == 400

    @pytest.mark.django_db
    def test_holidays_of_other_workspaces_are_invisible_and_cannot_be_deleted(
        self, admin_client, workspace, other_workspace
    ):
        foreign = CalendarHoliday.objects.create(workspace=other_workspace, date=date(2027, 1, 1), name="Foreign")

        assert admin_client.get(cal(workspace, "holidays/")).data == []
        assert admin_client.delete(cal(workspace, f"holidays/{foreign.id}/")).status_code == 404
        assert CalendarHoliday.objects.filter(pk=foreign.id).exists()


def audit_row(workspace, subject, **extra):
    return record_audit(
        workspace=workspace,
        entity=extra.pop("entity", "ENTRY"),
        action=extra.pop("action", "CREATE"),
        subject_user_id=subject.id if subject else None,
        **extra,
    )


@pytest.mark.contract
class TestAuditHistory:
    @pytest.mark.django_db
    def test_audit_rows_cannot_be_changed_or_deleted(self, workspace, member):
        row = audit_row(workspace, member, work_date=date(2027, 1, 4), new={"mode": "ONSITE"})

        row.entity = "TEAM"
        with pytest.raises(AuditIsAppendOnly):
            row.save()
        with pytest.raises(AuditIsAppendOnly):
            row.delete()
        row.refresh_from_db()
        assert row.entity == "ENTRY"

    @pytest.mark.django_db
    def test_a_member_reads_their_own_history_only(self, member_client, workspace, member, colleague):
        audit_row(workspace, member, work_date=date(2027, 1, 4))
        audit_row(workspace, colleague, work_date=date(2027, 1, 4))
        audit_row(workspace, None, entity="SETTINGS", action="UPDATE")

        own = member_client.get(cal(workspace, f"audit/?user={member.id}"))
        assert own.status_code == 200
        assert [str(row["subject_user"]) for row in own.data["results"]] == [str(member.id)]

        assert member_client.get(cal(workspace, f"audit/?user={colleague.id}")).status_code == 403
        # Without a user they get their own rows, never workspace-wide or colleagues' rows.
        default = member_client.get(cal(workspace, "audit/"))
        assert {str(row["subject_user"]) for row in default.data["results"]} == {str(member.id)}

    @pytest.mark.django_db
    def test_admin_reads_everyone_including_workspace_level_changes(self, admin_client, workspace, member, colleague):
        audit_row(workspace, member, work_date=date(2027, 1, 4))
        audit_row(workspace, colleague, work_date=date(2027, 1, 5))
        audit_row(workspace, None, entity="SETTINGS", action="UPDATE")

        everything = admin_client.get(cal(workspace, "audit/"))
        assert everything.data["total_results"] == 3
        only_member = admin_client.get(cal(workspace, f"audit/?user={member.id}"))
        assert only_member.data["total_results"] == 1
        only_settings = admin_client.get(cal(workspace, "audit/?entity=SETTINGS"))
        assert only_settings.data["total_results"] == 1

    @pytest.mark.django_db
    def test_a_team_lead_reads_their_team_when_policy_allows(self, lead_client, workspace, lead, member, colleague):
        make_team(workspace, "Platform", leads=[lead], members=[member])
        audit_row(workspace, member, work_date=date(2027, 1, 4))
        audit_row(workspace, colleague, work_date=date(2027, 1, 4))

        allowed = lead_client.get(cal(workspace, f"audit/?user={member.id}"))
        assert allowed.status_code == 200 and allowed.data["total_results"] == 1
        assert lead_client.get(cal(workspace, f"audit/?user={colleague.id}")).status_code == 403
        listing = lead_client.get(cal(workspace, "audit/"))
        assert {str(row["subject_user"]) for row in listing.data["results"]} == {str(member.id)}

        set_policy(workspace, team_view_access="ADMINS")
        assert lead_client.get(cal(workspace, f"audit/?user={member.id}")).status_code == 403

    @pytest.mark.django_db
    def test_all_members_policy_opens_colleagues_history(self, member_client, workspace, colleague):
        audit_row(workspace, colleague, work_date=date(2027, 1, 4))
        assert member_client.get(cal(workspace, f"audit/?user={colleague.id}")).status_code == 403

        set_policy(workspace, team_view_access="ALL_MEMBERS")

        assert member_client.get(cal(workspace, f"audit/?user={colleague.id}")).status_code == 200

    @pytest.mark.django_db
    def test_date_range_filters_by_work_date(self, admin_client, workspace, member):
        audit_row(workspace, member, work_date=date(2027, 1, 4))
        audit_row(workspace, member, work_date=date(2027, 2, 4))
        audit_row(workspace, member, work_date=None, entity="TEMPLATE")

        response = admin_client.get(cal(workspace, "audit/?from=2027-02-01&to=2027-02-28"))

        assert response.data["total_results"] == 1
        assert response.data["results"][0]["work_date"] == "2027-02-04"
        assert admin_client.get(cal(workspace, "audit/?user=nope")).status_code == 400

    @pytest.mark.django_db
    def test_guests_outsiders_and_other_workspaces_see_nothing(
        self, guest_client, outsider_client, admin_client, workspace, other_workspace, member
    ):
        audit_row(workspace, member, work_date=date(2027, 1, 4))

        assert guest_client.get(cal(workspace, "audit/")).status_code == 403
        assert outsider_client.get(cal(workspace, "audit/")).status_code == 403
        assert admin_client.get(cal(other_workspace, "audit/")).status_code == 403


def access_for(user, workspace):
    return CalendarAccess(user, workspace)


@pytest.mark.contract
class TestCalendarAccessRules:
    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "policy, expected",
        [
            ("ADMINS", {"admin": True, "lead": False, "member": False}),
            ("ADMINS_AND_LEADS", {"admin": True, "lead": True, "member": False}),
            ("ALL_MEMBERS", {"admin": True, "lead": True, "member": True}),
        ],
    )
    def test_team_view_policy(self, workspace, admin, lead, member, policy, expected):
        make_team(workspace, "Platform", leads=[lead])
        set_policy(workspace, team_view_access=policy)

        assert access_for(admin, workspace).can_view_team is expected["admin"]
        assert access_for(lead, workspace).can_view_team is expected["lead"]
        assert access_for(member, workspace).can_view_team is expected["member"]

    @pytest.mark.django_db
    def test_guests_and_outsiders_have_no_calendar_rights(self, workspace, guest, outsider, member):
        set_policy(workspace, team_view_access="ALL_MEMBERS", edit_others_access="ADMINS_AND_LEADS")

        for user in (guest, outsider):
            access = access_for(user, workspace)
            assert not access.is_calendar_user
            assert not access.can_view_team and not access.can_edit_others
            assert not access.can_view_user(user.id) and not access.can_view_user(member.id)
            assert not access.can_edit_user(user.id) and not access.can_edit_user(member.id)

    @pytest.mark.django_db
    def test_visible_users_follow_the_policy(self, workspace, admin, lead, member, colleague):
        make_team(workspace, "Platform", leads=[lead], members=[member])

        assert access_for(admin, workspace).visible_user_ids() is None
        assert access_for(member, workspace).visible_user_ids() == {member.id}
        assert access_for(lead, workspace).visible_user_ids() == {lead.id, member.id}
        assert access_for(colleague, workspace).visible_user_ids() == {colleague.id}

        set_policy(workspace, team_view_access="ADMINS")
        assert access_for(lead, workspace).visible_user_ids() == {lead.id}

        set_policy(workspace, team_view_access="ALL_MEMBERS")
        assert access_for(colleague, workspace).visible_user_ids() is None

    @pytest.mark.django_db
    def test_a_plain_team_member_does_not_get_lead_reach(self, workspace, lead, member, colleague):
        make_team(workspace, "Platform", leads=[lead], members=[member, colleague])

        assert access_for(member, workspace).visible_user_ids() == {member.id}
        assert not access_for(member, workspace).is_lead

    @pytest.mark.django_db
    def test_leads_of_other_workspaces_do_not_count(self, workspace, other_workspace, lead, member):
        join(other_workspace, lead, MEMBER)
        join(other_workspace, member, MEMBER)
        make_team(other_workspace, "Foreign", leads=[lead], members=[member])

        assert not access_for(lead, workspace).is_lead
        assert access_for(lead, workspace).visible_user_ids() == {lead.id}

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "policy, admin_can, lead_can_team, lead_can_other, member_can",
        [
            ("NONE", False, False, False, False),
            ("ADMINS", True, False, False, False),
            ("ADMINS_AND_LEADS", True, True, False, False),
        ],
    )
    def test_edit_others_policy(
        self, workspace, admin, lead, member, colleague, policy, admin_can, lead_can_team, lead_can_other, member_can
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])
        set_policy(workspace, edit_others_access=policy)

        assert access_for(admin, workspace).can_edit_user(colleague.id) is admin_can
        assert access_for(lead, workspace).can_edit_user(member.id) is lead_can_team
        assert access_for(lead, workspace).can_edit_user(colleague.id) is lead_can_other
        assert access_for(member, workspace).can_edit_user(colleague.id) is member_can

    @pytest.mark.django_db
    def test_everyone_may_edit_their_own_plan(self, workspace, admin, lead, member):
        set_policy(workspace, edit_others_access="NONE")

        for user in (admin, lead, member):
            assert access_for(user, workspace).can_edit_user(user.id)

    @pytest.mark.django_db
    def test_past_edit_window(self, workspace, admin, member):
        current = today()
        access = access_for(member, workspace)

        assert access.can_edit_date(current)
        assert access.can_edit_date(current + timedelta(days=30))
        assert not access.can_edit_date(current - timedelta(days=1))

        set_policy(workspace, member_edit_past_days=3)
        access = access_for(member, workspace)
        assert access.can_edit_date(current - timedelta(days=3))
        assert not access.can_edit_date(current - timedelta(days=4))

        # Admins have no limit.
        assert access_for(admin, workspace).can_edit_date(current - timedelta(days=500))

    @pytest.mark.django_db
    def test_left_the_workspace_means_no_rights(self, workspace, member):
        WorkspaceMember.objects.filter(workspace=workspace, member=member).update(is_active=False)

        access = access_for(member, workspace)

        assert access.role is None and not access.is_calendar_user
        assert access.visible_user_ids() == set()


@pytest.mark.contract
class TestFoundationConstraints:
    @pytest.mark.django_db
    def test_workspace_has_one_settings_row(self, workspace):
        from django.db import IntegrityError, transaction

        CalendarSettings.objects.create(workspace=workspace)

        with pytest.raises(IntegrityError), transaction.atomic():
            CalendarSettings.objects.create(workspace=workspace)

    @pytest.mark.django_db
    def test_a_user_joins_a_team_once(self, workspace, member):
        from django.db import IntegrityError, transaction

        team = make_team(workspace, "Platform", members=[member])

        with pytest.raises(IntegrityError), transaction.atomic():
            OpsTeamMember.objects.create(team=team, user=member, role="LEAD")

    @pytest.mark.django_db
    def test_workspace_deletion_cascades_to_calendar_data(self, workspace, member):
        team = make_team(workspace, "Platform", members=[member])
        CalendarHoliday.objects.create(workspace=workspace, date=date(2027, 1, 1), name="New Year")
        audit_row(workspace, member, work_date=date(2027, 1, 4))
        workspace_id = workspace.id

        # Hard delete: a workspace soft delete is handled by Plane's own task.
        workspace.delete(soft=False)

        assert not OpsTeam.objects.filter(pk=team.id).exists()
        assert not CalendarHoliday.objects.filter(workspace_id=workspace_id).exists()
        assert not CalendarAudit.objects.filter(workspace_id=workspace_id).exists()
