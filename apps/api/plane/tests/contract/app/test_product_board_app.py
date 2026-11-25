# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The board of the management team: who sees it, what is on it, what can be changed."""

import json
import time
from datetime import timedelta
from unittest import mock

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.notification_task import notifications
from plane.db.models import (
    Issue,
    IssueActivity,
    IssueSubscriber,
    Notification,
    Portfolio,
    ProductDetail,
    ProductType,
    Project,
    ProjectMember,
    State,
    Team,
    TeamMember,
    User,
    UserNotificationPreference,
    Workspace,
    WorkspaceMember,
)
from plane.utils.work_item_types import get_product_work_item_type

ADMIN, MEMBER, GUEST = 20, 15, 5
GROUPS = ("backlog", "started", "completed", "cancelled")


@pytest.fixture(autouse=True)
def _no_celery(mock_celery):
    yield


def make_user(workspace, name, role=MEMBER):
    user = User.objects.create(email=f"{name}@plane.so", username=name, first_name=name, display_name=name)
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    UserNotificationPreference.objects.get_or_create(user=user)
    return user


def make_project(s, name, portfolio, network=2):
    project = Project.objects.create(
        name=name, identifier=name.upper(), workspace=s.ws, portfolio=portfolio, network=network
    )
    project.board_states = {
        group: State.objects.create(
            project=project, workspace=s.ws, name=group, group=group, color="#fff", default=group == "backlog"
        )
        for group in GROUPS
    }
    return project


def make_product(s, project, name="Product", group="backlog", **detail):
    issue = Issue.objects.create(
        project=project,
        workspace=s.ws,
        name=name,
        type=s.kind,
        state=project.board_states[group],
        start_date="2026-11-01",
        target_date="2026-12-31",
        description_html="<p>secret text</p>",
    )
    ProductDetail.objects.create(
        issue=issue, project=project, workspace=s.ws, product_type=s.type, owner=s.owner, **detail
    )
    return issue


@pytest.fixture
def s(db, workspace, create_user):
    class S:
        pass

    s = S()
    workspace.is_team_structure_enabled = True
    workspace.save()
    s.ws, s.root = workspace, create_user
    UserNotificationPreference.objects.get_or_create(user=create_user)
    s.manager, s.team_admin, s.owner, s.outsider = (
        make_user(workspace, name) for name in ("manager", "team_admin", "owner", "outsider")
    )
    s.guest = make_user(workspace, "guest", GUEST)
    s.management = Team.objects.create(workspace=workspace, name="Management", kind="management")
    TeamMember.objects.create(team=s.management, member=s.manager, role=MEMBER)
    s.team = Team.objects.create(workspace=workspace, name="A")
    TeamMember.objects.create(team=s.team, member=s.team_admin, role=ADMIN)
    s.portfolio = Portfolio.objects.create(team=s.team, name="PA")
    s.kind = get_product_work_item_type(workspace.id)
    s.type = ProductType.objects.filter(workspace=workspace).first()
    s.project = make_project(s, "open", s.portfolio)
    s.closed = make_project(s, "closed", s.portfolio, network=0)
    ProjectMember.objects.create(project=s.project, workspace=workspace, member=s.owner, role=MEMBER)
    ProjectMember.objects.create(project=s.project, workspace=workspace, member=s.team_admin, role=ADMIN)
    s.product = make_product(s, s.project)
    s.secret = make_product(s, s.closed, "Secret", status_comment="hush", manual_progress=40)
    s.url = f"/api/workspaces/{workspace.slug}/product-board/"
    return s


def call(user, method, url, data=None):
    client = APIClient()
    client.force_authenticate(user=user)
    return getattr(client, method)(url, data, format="json")


def board(s, user, query=""):
    return call(user, "get", f"{s.url}{query}").data["results"]


def patch(s, _item, data, user=None, **expected):
    return call(user or s.manager, "patch", f"{s.url}{_item.id}/", {**data, "expected": expected})


@pytest.mark.contract
@pytest.mark.django_db
class TestAccess:
    def statuses(self, s, user):
        detail = f"{s.url}{s.product.id}/"
        body = {"manual_progress": 5, "expected": {"manual_progress": None}}
        return [
            call(user, "get", s.url).status_code,
            call(user, "get", f"{s.url}states/").status_code,
            call(user, "get", detail).status_code,
            call(user, "patch", detail, body).status_code,
        ]

    @pytest.mark.parametrize("name", ["manager", "root"])
    def test_allowed(self, s, name):
        assert self.statuses(s, getattr(s, name)) == [200] * 4

    @pytest.mark.parametrize("name", ["team_admin", "owner", "outsider", "guest"])
    def test_refused(self, s, name):
        assert self.statuses(s, getattr(s, name)) == [403] * 4
        assert ProductDetail.objects.get(issue=s.product).manual_progress is None

    def test_flag(self, s):
        Workspace.objects.filter(pk=s.ws.pk).update(is_team_structure_enabled=False)
        assert self.statuses(s, s.manager) == [403] * 4
        assert self.statuses(s, s.root) == [403] * 4

    def test_archived_management_team(self, s):
        Team.objects.filter(pk=s.management.pk).update(archived_at=timezone.now())
        assert self.statuses(s, s.manager) == [403] * 4

    def test_manager_who_became_guest_or_left(self, s):
        WorkspaceMember.objects.filter(member=s.manager).update(role=GUEST)
        assert self.statuses(s, s.manager) == [403] * 4
        WorkspaceMember.objects.filter(member=s.manager).update(role=MEMBER, is_active=False)
        assert self.statuses(s, s.manager) == [403] * 4

    def test_other_workspace(self, s):
        other = Workspace.objects.create(name="O", slug="o", owner=s.root, is_team_structure_enabled=True)
        WorkspaceMember.objects.create(workspace=other, member=s.outsider, role=ADMIN)
        url = f"/api/workspaces/o/product-board/{s.product.id}/"
        assert call(s.outsider, "get", url).status_code == 404
        body = {"manual_progress": 5, "expected": {"manual_progress": None}}
        assert call(s.outsider, "patch", url, body).status_code == 404
        assert call(s.outsider, "get", "/api/workspaces/o/product-board/").data["results"] == []
        assert call(s.outsider, "get", s.url).status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
class TestContent:
    def test_row(self, s):
        (row,) = board(s, s.manager)
        assert row["id"] == s.product.id and row["team_id"] == s.team.id
        assert row["portfolio_id"] == s.portfolio.id and row["project_name"] == "open"
        assert row["can_edit"] and not row["can_open"] and not row["is_closed"]

    @pytest.mark.parametrize("place", ["none", "portfolio", "team", "project", "item", "management"])
    def test_off_the_board(self, s, place):
        now = timezone.now()
        if place == "none":
            Project.objects.filter(pk=s.project.pk).update(portfolio=None)
        elif place == "portfolio":
            Portfolio.objects.filter(pk=s.portfolio.pk).update(archived_at=now)
        elif place == "team":
            Team.objects.filter(pk=s.team.pk).update(archived_at=now)
        elif place == "project":
            Project.objects.filter(pk=s.project.pk).update(archived_at=now)
        elif place == "item":
            Issue.objects.filter(pk=s.product.pk).update(archived_at=now.date())
        else:
            Team.objects.filter(pk=s.management.pk).update(kind="regular")
            Team.objects.filter(pk=s.team.pk).update(kind="management")
        user = s.root
        assert board(s, user, "?include_old=1") == []
        assert call(user, "get", f"{s.url}{s.product.id}/").status_code == 404
        assert patch(s, s.product, {"manual_progress": 1}, user, manual_progress=None).status_code == 404

    def test_tasks_and_former_products_are_not_on_it(self, s):
        Issue.objects.create(project=s.project, workspace=s.ws, name="Task", state=s.project.board_states["backlog"])
        Issue.objects.filter(pk=s.product.pk).update(type=None)
        assert board(s, s.manager) == []

    def test_ninety_days(self, s):
        now = timezone.now()
        old = make_product(s, s.project, "old", "cancelled", closed_at=now - timedelta(days=90, minutes=1))
        fresh = make_product(s, s.project, "fresh", "completed", closed_at=now - timedelta(days=89, hours=23))
        # Reopened long ago: the state decides.
        open_again = make_product(s, s.project, "again", "started", closed_at=now - timedelta(days=200))
        ids = {row["id"] for row in board(s, s.manager)}
        assert ids == {s.product.id, fresh.id, open_again.id}
        assert old.id in {row["id"] for row in board(s, s.manager, "?include_old=1")}

    def test_detail(self, s):
        Issue.objects.create(
            project=s.project, workspace=s.ws, name="T", parent=s.product, state=s.project.board_states["started"]
        )
        data = call(s.manager, "get", f"{s.url}{s.product.id}/").data
        assert data["description_html"] == "<p>secret text</p>"
        assert [task["name"] for task in data["tasks"]] == ["T"]
        assert data["meetings"] == []

    def test_states(self, s):
        assert set(call(s.manager, "get", f"{s.url}states/").data) == {str(s.project.id)}
        assert set(call(s.root, "get", f"{s.url}states/").data) == {str(s.project.id), str(s.closed.id)}

    def test_query_count_and_paging(self, s):
        for index in range(4):
            make_product(s, s.project, f"P{index}")
        with CaptureQueriesContext(connection) as few:
            board(s, s.manager)
        for index in range(45):
            make_product(s, s.project, f"Q{index}")
        with CaptureQueriesContext(connection) as many:
            assert len(board(s, s.manager)) == 50
        assert len(many) == len(few)
        with mock.patch("plane.app.views.product_board.base.PAGE_SIZE", 20):
            first = call(s.manager, "get", s.url).data
            assert first["total"] == 50 and first["next_offset"] == 20
            seen = {row["id"] for offset in (0, 20, 40) for row in board(s, s.manager, f"?offset={offset}")}
            assert len(seen) == 50
        assert call(s.manager, "get", f"{s.url}?offset=x").status_code == 400

    def test_five_hundred(self, s):
        for index in range(499):
            make_product(s, s.project, f"P{index}")
        start = time.monotonic()
        assert len(board(s, s.manager)) == 500
        assert time.monotonic() - start < 2


@pytest.mark.contract
@pytest.mark.django_db
class TestClosedProjects:
    def test_hidden_by_default(self, s):
        assert s.secret.id not in {row["id"] for row in board(s, s.root)}

    def test_limited(self, s):
        row = next(row for row in board(s, s.manager, "?include_closed=1") if row["id"] == s.secret.id)
        assert row["is_limited"] and not row["can_edit"] and not row["can_open"]
        assert row["name"] == "Secret" and row["progress"] == 40 and row["team_id"] == s.team.id
        hidden = ("status_comment", "project_id", "project_name", "project_identifier", "portfolio_id", "owner_id")
        assert all(row[key] is None for key in hidden)
        detail = call(s.manager, "get", f"{s.url}{s.secret.id}/")
        assert "description_html" not in detail.data and "tasks" not in detail.data
        assert "hush" not in detail.content.decode() and "secret text" not in detail.content.decode()
        response = patch(s, s.secret, {"manual_progress": 1}, manual_progress=40)
        assert response.status_code == 403
        # Nor does a wrong guess reveal the stored value.
        assert "hush" not in patch(s, s.secret, {"status_comment": "x"}, status_comment="").content.decode()

    def test_project_guest_stays_limited(self, s):
        ProjectMember.objects.create(project=s.closed, workspace=s.ws, member=s.manager, role=GUEST)
        assert patch(s, s.secret, {"manual_progress": 1}, manual_progress=40).status_code == 403

    @pytest.mark.parametrize("who", ["member", "admin"])
    def test_full(self, s, who):
        user = s.root
        if who == "member":
            user = s.manager
            ProjectMember.objects.create(project=s.closed, workspace=s.ws, member=user, role=MEMBER)
        row = next(row for row in board(s, user, "?include_closed=1") if row["id"] == s.secret.id)
        assert row["status_comment"] == "hush" and row["can_edit"]
        assert patch(s, s.secret, {"manual_progress": 1}, user, manual_progress=40).status_code == 200


@pytest.mark.contract
@pytest.mark.django_db
class TestEdit:
    def test_each_field(self, s):
        done = s.project.board_states["completed"]
        cases = [
            ("start_date", "2026-11-02", "2026-11-01"),
            ("target_date", "2026-12-30", "2026-12-31"),
            ("state_id", str(done.id), str(s.project.board_states["backlog"].id)),
            ("manual_progress", 0, None),
            ("manual_progress", None, 0),
            ("status_comment", "Waiting", ""),
        ]
        for field, value, before in cases:
            response = patch(s, s.product, {field: value}, **{field: before})
            assert response.status_code == 200, (field, response.data)
            assert str(response.data[field]) == str(value)
        detail = ProductDetail.objects.get(issue=s.product)
        assert detail.closed_at is not None and detail.status_comment_by_id == s.manager.id

    @pytest.mark.parametrize(
        "field",
        ["name", "owner_id", "product", "kind", "type", "parent_id", "priority", "project_id", "description_html"],
    )
    def test_other_fields(self, s, field):
        for data in ({field: "x"}, {field: "x", "manual_progress": 1}):
            response = patch(s, s.product, data, manual_progress=None, **{field: "y"})
            assert response.status_code == 400
        s.product.refresh_from_db()
        assert s.product.name == "Product"
        assert ProductDetail.objects.get(issue=s.product).manual_progress is None

    @pytest.mark.parametrize(
        "data",
        [
            {"start_date": None},
            {"target_date": None},
            {"target_date": "2026-10-01"},
            {"state_id": None},
            {"manual_progress": 101},
            {"manual_progress": -1},
            {"status_comment": "x" * 501},
        ],
    )
    def test_bad_values(self, s, data):
        row = board(s, s.manager)[0]
        field = next(iter(data))
        assert patch(s, s.product, data, **{field: row[field]}).status_code == 400

    def test_state_of_another_project(self, s):
        foreign = s.closed.board_states["started"]
        before = str(s.project.board_states["backlog"].id)
        assert patch(s, s.product, {"state_id": str(foreign.id)}, state_id=before).status_code == 400

    def test_body(self, s):
        url = f"{s.url}{s.product.id}/"
        for body in ({}, {"expected": {}}, {"manual_progress": 1}, {"manual_progress": 1, "expected": []}, [1]):
            assert call(s.manager, "patch", url, body).status_code == 400, body

    @pytest.mark.parametrize(
        "field,wrong,value",
        [
            ("start_date", "2026-10-30", "2026-11-05"),
            ("target_date", "2026-12-01", "2026-12-25"),
            ("state_id", "00000000-0000-0000-0000-000000000000", "started"),
            ("manual_progress", 7, 8),
            ("status_comment", "old", "new"),
        ],
    )
    def test_conflict(self, s, field, wrong, value):
        if field == "state_id":
            value = str(s.project.board_states[value].id)
        response = patch(s, s.product, {field: value}, **{field: wrong})
        assert response.status_code == 409
        assert response.data["fields"] == [field] and response.data["product"]["id"] == s.product.id

    def test_change_of_another_field_is_no_conflict(self, s):
        ProductDetail.objects.filter(issue=s.product).update(status_comment="changed by the team")
        assert patch(s, s.product, {"manual_progress": 10}, manual_progress=None).status_code == 200

    def test_dates_moved_in_bulk_are_noticed(self, s):
        Issue.objects.filter(pk=s.product.pk).update(target_date="2026-12-24")
        response = patch(s, s.product, {"target_date": "2026-12-30"}, target_date="2026-12-31")
        assert response.status_code == 409

    def test_history_webhook_and_the_owner(self, s):
        with (
            mock.patch("plane.utils.issue_updates.issue_activity.delay") as activity,
            mock.patch("plane.utils.issue_updates.model_activity.delay") as webhook,
        ):
            patch(s, s.product, {"manual_progress": 30}, manual_progress=None)
        assert webhook.called
        kwargs = activity.call_args.kwargs
        assert json.loads(kwargs["requested_data"]) == {"product": {"manual_progress": 30}}
        sent = []
        target = "plane.bgtasks.issue_activities_task.notifications.delay"
        with mock.patch(target, side_effect=lambda **kw: sent.append(kw)):
            issue_activity(**kwargs)
        for kw in sent:
            notifications(**kw)
        entry = IssueActivity.objects.get(issue=s.product, field="manual_progress")
        assert entry.actor_id == s.manager.id and entry.new_value == "30"
        assert Notification.objects.filter(receiver=s.owner).count() == 1
        # The manager does not become a follower of a project they are not in.
        assert not IssueSubscriber.objects.filter(issue=s.product, subscriber=s.manager).exists()
        assert not ProjectMember.objects.filter(project=s.project, member=s.manager).exists()

    def test_refused_change_leaves_no_trace(self, s):
        with mock.patch("plane.utils.issue_updates.issue_activity.delay") as activity:
            patch(s, s.product, {"manual_progress": 500}, manual_progress=None)
            patch(s, s.product, {"manual_progress": 5}, manual_progress=1)
        assert not activity.called and not IssueSubscriber.objects.filter(issue=s.product).exists()
