# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Entry CRUD, logging on behalf, visibility and bulk actions."""

import uuid
from datetime import date, timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.bgtasks.deletion_task import soft_delete_related_objects
from plane.db.models import ProjectMember
from plane.tests.factories_time_tracking import IssueFactory, TimeEntryFactory, build_world, client_for
from plane.time_tracking.models import TimeEntry


@pytest.fixture
def world(db):
    return build_world()


def entries_url(world, suffix=""):
    return f"/api/workspaces/{world.slug}/time-entries/{suffix}"


def today():
    return timezone.now().date()


@pytest.mark.contract
class TestCreate:
    def test_duration_mode(self, world):
        response = client_for(world.ben).post(
            entries_url(world),
            {
                "project_id": str(world.web.id),
                "issue_id": str(world.web_1.id),
                "spent_on": str(today()),
                "duration_seconds": 5400,
                "description": "Code review",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["duration_seconds"] == 5400
        assert response.data["source"] == "manual"
        assert response.data["user_id"] == str(world.ben.id)
        assert response.data["created_by_id"] == str(world.ben.id)
        assert response.data["can_edit"] is True

    def test_start_end_mode(self, world):
        end = timezone.now().replace(microsecond=0) - timedelta(minutes=5)
        response = client_for(world.ben).post(
            entries_url(world),
            {
                "project_id": str(world.web.id),
                "started_at": (end - timedelta(hours=1)).isoformat(),
                "ended_at": end.isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["duration_seconds"] == 3600

    def test_ambiguous(self, world):
        response = client_for(world.ben).post(entries_url(world), {"project_id": str(world.web.id)}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "AMBIGUOUS_ENTRY_MODE"

    def test_future_date(self, world):
        response = client_for(world.ben).post(
            entries_url(world),
            {"project_id": str(world.web.id), "spent_on": str(today() + timedelta(days=2)), "duration_seconds": 60},
            format="json",
        )
        assert response.data["code"] == "FUTURE_TIME" and response.data["field"] == "spent_on"

    def test_issue_from_another_project(self, world):
        response = client_for(world.ana).post(
            entries_url(world),
            {"project_id": str(world.web.id), "issue_id": str(world.sec_1.id), "duration_seconds": 600},
            format="json",
        )
        assert response.data["code"] == "ISSUE_NOT_IN_PROJECT"

    @pytest.mark.parametrize("kind", ["archived", "draft"])
    def test_issue_not_loggable(self, world, kind):
        item = (
            IssueFactory(project=world.web, archived_at=date(2026, 1, 1))
            if kind == "archived"
            else IssueFactory(project=world.web, is_draft=True)
        )
        response = client_for(world.ben).post(
            entries_url(world), {"issue_id": str(item.id), "duration_seconds": 600}, format="json"
        )
        assert response.data["code"] == "ISSUE_NOT_LOGGABLE"

    def test_archived_project(self, world):
        world.web.archived_at = timezone.now()
        world.web.save()
        response = client_for(world.ben).post(
            entries_url(world), {"project_id": str(world.web.id), "duration_seconds": 600}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "PROJECT_NOT_LOGGABLE"

    def test_non_member_and_guest(self, world):
        payload = {"project_id": str(world.web.id), "duration_seconds": 600}
        assert client_for(world.cal).post(entries_url(world), payload, format="json").data["code"] == (
            "PROJECT_NOT_LOGGABLE"
        )
        response = client_for(world.gil).post(entries_url(world), payload, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN and response.data["code"] == "FORBIDDEN"


@pytest.mark.contract
class TestUpdateDelete:
    def test_owner_patches_and_deletes(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        ben = client_for(world.ben)
        response = ben.patch(entries_url(world, f"{entry.id}/"), {"duration_seconds": 1800}, format="json")
        assert response.status_code == status.HTTP_200_OK and response.data["duration_seconds"] == 1800
        assert ben.delete(entries_url(world, f"{entry.id}/")).status_code == status.HTTP_204_NO_CONTENT
        assert ben.get(entries_url(world, f"{entry.id}/")).status_code == status.HTTP_404_NOT_FOUND

    def test_other_member_is_forbidden(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.pia)
        ben = client_for(world.ben)
        assert ben.get(entries_url(world, f"{entry.id}/")).data["can_edit"] is False
        response = ben.patch(entries_url(world, f"{entry.id}/"), {"description": "x"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN and response.data["code"] == "FORBIDDEN"
        assert ben.delete(entries_url(world, f"{entry.id}/")).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.parametrize("admin", ["pia", "ana"])
    def test_admins_edit_and_delete(self, world, admin):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        client = client_for(getattr(world, admin))
        response = client.patch(entries_url(world, f"{entry.id}/"), {"description": "fixed"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        entry.refresh_from_db()
        assert entry.user_id == world.ben.id and entry.updated_by_id == getattr(world, admin).id
        assert client.delete(entries_url(world, f"{entry.id}/")).status_code == status.HTTP_204_NO_CONTENT

    def test_confirm_clears_auto_stopped(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, auto_stopped=True)
        response = client_for(world.ben).patch(entries_url(world, f"{entry.id}/"), {"confirm": True}, format="json")
        assert response.data["auto_stopped"] is False

    def test_unknown_entry_is_404(self, world):
        response = client_for(world.ben).get(entries_url(world, f"{uuid.uuid4()}/"))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_deleting_the_work_item_turns_entries_into_project_time(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        world.web_1.deleted_at = timezone.now()
        world.web_1.save()
        soft_delete_related_objects("db", "issue", world.web_1.id)
        entry.refresh_from_db()
        assert entry.issue_id is None and entry.deleted_at is None and entry.duration_seconds == 3600

    def test_deleting_the_project_deletes_its_entries(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        world.web.deleted_at = timezone.now()
        world.web.save()
        soft_delete_related_objects("db", "project", world.web.id)
        assert TimeEntry.all_objects.get(id=entry.id).deleted_at is not None


@pytest.mark.contract
class TestOnBehalf:
    def test_project_admin_logs_for_a_member(self, world):
        response = client_for(world.pia).post(
            entries_url(world),
            {"project_id": str(world.web.id), "user_id": str(world.ben.id), "duration_seconds": 3 * 3600},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["user_id"] == str(world.ben.id)
        assert response.data["created_by_id"] == str(world.pia.id)

    def test_member_sending_user_id_is_forbidden(self, world):
        response = client_for(world.ben).post(
            entries_url(world),
            {"project_id": str(world.web.id), "user_id": str(world.pia.id), "duration_seconds": 600},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_targeting_a_non_member(self, world):
        response = client_for(world.pia).post(
            entries_url(world),
            {"project_id": str(world.web.id), "user_id": str(world.cal.id), "duration_seconds": 600},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "TARGET_USER_NOT_PROJECT_MEMBER"

    def test_workspace_admin_outside_the_project(self, world):
        ProjectMember.objects.filter(project=world.web, member=world.ana).update(is_active=False)
        response = client_for(world.ana).post(
            entries_url(world),
            {"project_id": str(world.web.id), "user_id": str(world.ben.id), "duration_seconds": 600},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data


@pytest.mark.contract
class TestVisibility:
    def _ids(self, client, world, **params):
        response = client.get(entries_url(world), params)
        assert response.status_code == status.HTTP_200_OK, response.data
        return {row["id"] for row in response.data["results"]}

    def test_who_sees_what(self, world):
        web = str(TimeEntryFactory(project=world.web, user=world.pia).id)
        sec = str(TimeEntryFactory(project=world.sec, user=world.ana).id)
        assert self._ids(client_for(world.cal), world) == {web}  # public project, not a member
        assert self._ids(client_for(world.ben), world) == {web}  # secret project hidden
        assert self._ids(client_for(world.ana), world) == {web, sec}  # workspace admin
        assert client_for(world.ben).get(entries_url(world, f"{sec}/")).status_code == status.HTTP_404_NOT_FOUND

    def test_guest_gets_403_everywhere(self, world):
        gil = client_for(world.gil)
        base = f"/api/workspaces/{world.slug}"
        project = f"{base}/projects/{world.web.id}"
        for path in [
            "/time-entries/",
            "/time-entries/timer/",
            "/time-entries/summary/",
            "/time-entries/report/",
            f"/time-entries/timesheet/?week_start_date={today()}",
            "/time-entries/export/",
        ]:
            assert gil.get(base + path).status_code == status.HTTP_403_FORBIDDEN, path
        for path in ["/time-entries/issue-totals/", f"/issues/{world.web_1.id}/time-entries/", "/time-settings/"]:
            assert gil.get(project + path).status_code == status.HTTP_403_FORBIDDEN, path
        assert gil.post(base + "/time-entries/bulk/", {}, format="json").status_code == status.HTTP_403_FORBIDDEN

    def test_running_entries_are_pinned_first(self, world):
        TimeEntryFactory(project=world.web, user=world.pia, spent_on=today())
        running = TimeEntryFactory.running(project=world.web, user=world.ben)
        TimeEntryFactory(project=world.web, user=world.pia, spent_on=today())
        response = client_for(world.ben).get(entries_url(world), {"order_by": "duration_seconds"})
        assert response.data["results"][0]["id"] == str(running.id)
        assert response.data["results"][0]["is_running"] is True
        response = client_for(world.ben).get(entries_url(world), {"include_running": "false"})
        assert str(running.id) not in {r["id"] for r in response.data["results"]}

    def test_pagination(self, world):
        for i in range(5):
            TimeEntryFactory(project=world.web, user=world.ben, spent_on=today() - timedelta(days=i))
        response = client_for(world.ben).get(entries_url(world), {"per_page": 2})
        assert len(response.data["results"]) == 2
        assert response.data["next_page_results"] is True
        response = client_for(world.ben).get(
            entries_url(world), {"per_page": 2, "cursor": response.data["next_cursor"]}
        )
        assert len(response.data["results"]) == 2

    def test_list_query_count_is_flat(self, world, django_assert_max_num_queries):
        for _ in range(20):
            TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        client = client_for(world.ben)
        with django_assert_max_num_queries(12):
            client.get(entries_url(world))


@pytest.mark.contract
class TestBulk:
    def url(self, world):
        return entries_url(world, "bulk/")

    def test_delete_own(self, world):
        ids = [str(TimeEntryFactory(project=world.web, user=world.ben).id) for _ in range(3)]
        response = client_for(world.ben).post(self.url(world), {"action": "delete", "ids": ids}, format="json")
        assert response.status_code == status.HTTP_200_OK and response.data == {"updated": 3}

    def test_mixed_is_403_and_changes_nothing(self, world):
        mine = TimeEntryFactory(project=world.web, user=world.ben)
        theirs = TimeEntryFactory(project=world.web, user=world.pia)
        response = client_for(world.ben).post(
            self.url(world),
            {"action": "set_billable", "ids": [str(mine.id), str(theirs.id)], "is_billable": True},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        mine.refresh_from_db()
        assert mine.is_billable is False

    def test_limit(self, world):
        ids = [str(uuid.uuid4()) for _ in range(501)]
        response = client_for(world.ben).post(self.url(world), {"action": "delete", "ids": ids}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST and response.data["code"] == "BULK_LIMIT"
