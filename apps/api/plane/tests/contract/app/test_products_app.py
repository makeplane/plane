# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Products through both APIs: required fields, conversion, deletion and places that exclude them."""

from datetime import timedelta
from unittest import mock
from urllib.parse import urlencode

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from plane.bgtasks.deletion_task import hard_delete, soft_delete_related_objects
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.issue_automation_task import archive_old_issues, close_old_issues
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueActivity,
    IssueType,
    Module,
    Portfolio,
    ProductDetail,
    ProductType,
    Project,
    ProjectMember,
    State,
    Team,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.utils.work_item_types import get_product_work_item_type

ADMIN, MEMBER, GUEST = 20, 15, 5


@pytest.fixture(autouse=True)
def _no_celery(mock_celery):
    yield


def make_user(workspace, name, role=MEMBER):
    user = User.objects.create(email=f"{name}@plane.so", username=name, first_name=name)
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    return user


@pytest.fixture
def s(db, workspace, create_user):
    class S:
        pass

    s = S()
    workspace.is_team_structure_enabled = True
    workspace.save()
    s.ws, s.root = workspace, create_user
    s.member, s.guest, s.outsider = (
        make_user(workspace, "member"),
        make_user(workspace, "guest", GUEST),
        make_user(workspace, "outsider"),
    )
    s.team = Team.objects.create(workspace=workspace, name="A")
    s.portfolio = Portfolio.objects.create(team=s.team, name="PA")
    s.project = Project.objects.create(name="One", identifier="ONE", workspace=workspace, portfolio=s.portfolio)
    for user, role in ((s.root, ADMIN), (s.member, MEMBER), (s.guest, GUEST)):
        ProjectMember.objects.create(project=s.project, workspace=workspace, member=user, role=role)
    s.states = {
        group: State.objects.create(
            project=s.project, workspace=workspace, name=group, group=group, color="#fff", default=group == "backlog"
        )
        for group in ("backlog", "started", "completed", "cancelled")
    }
    get_product_work_item_type(workspace.id)
    s.type = ProductType.objects.get(workspace=workspace, name="Датасет")
    s.url = f"/api/workspaces/{workspace.slug}/projects/{s.project.id}"
    s.v1 = f"/api/v1/workspaces/{workspace.slug}/projects/{s.project.id}"
    s.body = {
        "name": "Product",
        "kind": "product",
        "start_date": "2026-11-01",
        "target_date": "2026-12-31",
        "product": {"product_type_id": str(s.type.id), "owner_id": str(s.member.id)},
    }
    return s


def call(user, method, url, data=None):
    client = APIClient()
    client.force_authenticate(user=user)
    return getattr(client, method)(url, data, format="json")


def create(s, **changes):
    response = call(s.member, "post", f"{s.url}/issues/", {**s.body, **changes})
    assert response.status_code == 201, response.data
    return Issue.objects.get(pk=response.data["id"])


def task(s, parent=None, group="backlog", **fields):
    return Issue.objects.create(
        project=s.project, workspace=s.ws, name="Task", parent=parent, state=s.states[group], **fields
    )


def patch(s, issue, data, user=None):
    return call(user or s.member, "patch", f"{s.url}/issues/{issue.id}/", data)


BAD = [
    ({"start_date": None}, "start_date"),
    ({"target_date": None}, "target_date"),
    ({"target_date": "2026-10-01"}, None),
    ({"product": {}}, "product_type_id"),
]


@pytest.mark.contract
@pytest.mark.django_db
class TestCreate:
    def test_created(self, s):
        response = call(s.member, "post", f"{s.url}/issues/", s.body)
        assert response.status_code == 201, response.data
        assert response.data["kind"] == "product"
        assert response.data["product"]["owner_id"] == str(s.member.id)
        detail = call(s.member, "get", f"{s.url}/issues/{response.data['id']}/").data
        assert detail["kind"] == "product"
        assert detail["product"]["calculated_progress"] is None

    @pytest.mark.parametrize("change,field", BAD)
    @pytest.mark.parametrize("api", ["url", "v1"])
    def test_required(self, s, change, field, api):
        path = "issues" if api == "url" else "work-items"
        response = call(s.member, "post", f"{getattr(s, api)}/{path}/", {**s.body, **change})
        assert response.status_code == 400
        if field:
            assert field in response.data
        assert not Issue.objects.exists()

    def test_owner_required_and_member_of_the_project(self, s):
        for owner in ({}, {"owner_id": str(s.outsider.id)}, {"owner_id": str(s.guest.id)}):
            body = {**s.body, "product": {"product_type_id": str(s.type.id), **owner}}
            assert call(s.member, "post", f"{s.url}/issues/", body).status_code == 400

    def test_public_api(self, s):
        response = call(s.member, "post", f"{s.v1}/work-items/", s.body)
        assert response.status_code == 201, response.data
        assert response.data["kind"] == "product"
        listed = call(s.member, "get", f"{s.v1}/work-items/")
        assert listed.data["results"][0]["product"]["product_type_id"] == str(s.type.id)

    def test_type_of_other_workspace_and_inactive(self, s):
        other = Workspace.objects.create(name="Other", slug="other", owner=s.root)
        foreign = ProductType.objects.create(workspace=other, name="X")
        inactive = ProductType.objects.create(workspace=s.ws, name="Y", is_active=False)
        for product_type in (foreign, inactive):
            body = {**s.body, "product": {**s.body["product"], "product_type_id": str(product_type.id)}}
            assert call(s.member, "post", f"{s.url}/issues/", body).status_code == 400
        work_item_type = IssueType.objects.create(workspace=other, name="Z")
        body = {"name": "T", "type_id": str(work_item_type.id)}
        assert call(s.member, "post", f"{s.v1}/work-items/", body).status_code == 400
        body = {"name": "T", "type": str(work_item_type.id)}
        assert call(s.member, "post", f"{s.url}/issues/", body).status_code == 400

    def test_flag_and_guest(self, s):
        s.ws.is_team_structure_enabled = False
        s.ws.save()
        assert call(s.member, "post", f"{s.url}/issues/", s.body).status_code == 400
        s.ws.is_team_structure_enabled = True
        s.ws.save()
        assert call(s.guest, "post", f"{s.url}/issues/", s.body).status_code == 403
        own = task(s)
        Issue.objects.filter(pk=own.pk).update(created_by=s.guest)
        assert patch(s, own, s.body, s.guest).status_code == 400

    def test_old_tasks_work_as_before(self, s):
        response = call(s.member, "post", f"{s.url}/issues/", {"name": "T"})
        assert response.status_code == 201
        assert response.data["kind"] == "task" and response.data["type_id"] is None
        issue = Issue.objects.get(pk=response.data["id"])
        assert patch(s, issue, {"name": "New"}).status_code == 204
        assert patch(s, issue, {"product": {"manual_progress": 1}}).status_code == 400


@pytest.mark.contract
@pytest.mark.django_db
class TestUpdate:
    def test_required_fields_cannot_be_cleared(self, s):
        product = create(s)
        for data in (
            {"start_date": None},
            {"target_date": None},
            {"product": {"product_type_id": None}},
            {"product": {"owner_id": None}},
            {"target_date": "2026-01-01"},
            {"product": {"manual_progress": 101}},
            {"product": {"status_comment": "x" * 501}},
        ):
            assert patch(s, product, data).status_code == 400, data
        assert patch(s, product, {"type": None}).status_code == 204
        product.refresh_from_db()
        assert product.type.kind == "product"

    def test_manual_progress_zero_and_cleared(self, s):
        product = create(s)
        task(s, product, "completed")
        read = lambda: call(s.member, "get", f"{s.url}/issues/{product.id}/").data["product"]  # noqa: E731
        assert (read()["progress"], read()["calculated_progress"]) == (100, 100)
        assert patch(s, product, {"product": {"manual_progress": 0}}).status_code == 204
        assert (read()["progress"], read()["calculated_progress"]) == (0, 100)
        assert patch(s, product, {"product": {"manual_progress": None}}).status_code == 204
        assert read()["progress"] == 100

    def test_comment_author(self, s):
        product = create(s)
        assert patch(s, product, {"product": {"status_comment": "Hi"}}, s.root).status_code == 204
        detail = ProductDetail.objects.get(issue=product)
        assert detail.status_comment_by_id == s.root.id and detail.status_comment_at

    def test_closed_at(self, s):
        product = create(s)
        closed = lambda: ProductDetail.objects.get(issue=product).closed_at  # noqa: E731
        assert closed() is None
        patch(s, product, {"state_id": str(s.states["cancelled"].id)})
        assert closed() is not None
        patch(s, product, {"state_id": str(s.states["started"].id)})
        assert closed() is None

    def test_nesting(self, s):
        product, other, child = create(s), create(s), task(s)
        assert patch(s, child, {"parent_id": str(product.id)}).status_code == 204
        assert patch(s, product, {"parent_id": str(other.id)}).status_code == 400
        assert patch(s, child, {"parent_id": str(child.id)}).status_code == 400
        url = f"{s.url}/issues/{other.id}/sub-issues/"
        assert call(s.member, "post", url, {"sub_issue_ids": [str(product.id)]}).status_code == 400
        assert call(s.member, "post", url, {"sub_issue_ids": [str(child.id)]}).status_code == 200

    def test_conversion(self, s):
        issue = task(s)
        assert patch(s, issue, {"kind": "product"}).status_code == 400
        assert patch(s, issue, s.body).status_code == 204
        child = task(s, issue)
        assert patch(s, issue, {"kind": "task"}).status_code == 400
        child.parent = None
        child.save()
        assert patch(s, issue, {"kind": "task"}).status_code == 204
        assert ProductDetail.objects.filter(issue=issue).exists()
        # The kept fields are enough to become a product again.
        assert patch(s, issue, {"kind": "product"}).status_code == 204
        child = task(s, parent=create(s))
        assert patch(s, child, s.body).status_code == 400

    def test_not_from_a_cycle(self, s):
        issue = task(s)
        cycle = Cycle.objects.create(project=s.project, workspace=s.ws, name="C", owned_by=s.root)
        CycleIssue.objects.create(issue=issue, cycle=cycle, project=s.project, workspace=s.ws)
        assert patch(s, issue, s.body).status_code == 400

    def test_bulk_dates(self, s):
        product = create(s)
        url = f"{s.url}/issue-dates/"
        bad = {"updates": [{"id": str(product.id), "target_date": "2020-01-01"}]}
        assert call(s.member, "post", url, bad).status_code == 400
        none = {"updates": [{"id": str(product.id), "target_date": None, "start_date": None}]}
        call(s.member, "post", url, none)
        product.refresh_from_db()
        assert product.start_date and product.target_date

    def test_history(self, s):
        product = create(s)
        current = '{"kind": "product", "product": {"manual_progress": 0, "product_type_id": "%s"}}' % s.type.id
        issue_activity(
            type="issue.activity.updated",
            requested_data='{"product": {"manual_progress": 5, "status_comment": "Hi"}}',
            current_instance=current,
            issue_id=str(product.id),
            actor_id=str(s.member.id),
            project_id=str(s.project.id),
            epoch=1,
        )
        fields = IssueActivity.objects.filter(issue=product).values_list("field", "old_value", "new_value")
        assert set(fields) == {("manual_progress", "0", "5"), ("status_comment", "", "Hi")}


@pytest.mark.contract
@pytest.mark.django_db
class TestDelete:
    def survives(self, child):
        child = Issue.all_objects.get(pk=child.pk)
        return child.deleted_at is None and child.parent_id is None

    def purge(self, product):
        """What celery does after a deletion, down to the final removal."""
        soft_delete_related_objects("db", "issue", product.pk)
        Issue.all_objects.filter(pk=product.pk).update(deleted_at=timezone.now() - timedelta(days=1000))
        hard_delete()
        assert not Issue.all_objects.filter(pk=product.pk).exists()

    @pytest.mark.parametrize("way", ["single", "bulk", "public"])
    def test_children_stay(self, s, way):
        product = create(s)
        children = [
            task(s, product),
            task(s, product, archived_at=timezone.now().date()),
            task(s, product, is_draft=True),
        ]
        grandchild = task(s, children[0])
        if way == "single":
            response = call(s.member, "delete", f"{s.url}/issues/{product.id}/")
        elif way == "bulk":
            response = call(s.root, "delete", f"{s.url}/bulk-delete-issues/", {"issue_ids": [str(product.id)]})
        else:
            response = call(s.root, "delete", f"{s.v1}/work-items/{product.id}/")
        assert response.status_code in (200, 204), response.data
        self.purge(product)
        assert all(self.survives(child) for child in children)
        assert Issue.objects.get(pk=grandchild.pk).parent_id == children[0].pk
        assert IssueActivity.objects.filter(issue=children[0], field="parent").exists()

    def test_tasks_still_take_their_sub_tasks(self, s):
        parent = task(s)
        child = task(s, parent)
        call(s.root, "delete", f"{s.url}/issues/{parent.id}/")
        soft_delete_related_objects("db", "issue", parent.pk)
        assert Issue.all_objects.get(pk=child.pk).deleted_at is not None

    def test_only_author_or_admin(self, s):
        product = create(s)
        other = make_user(s.ws, "other")
        ProjectMember.objects.create(project=s.project, workspace=s.ws, member=other, role=MEMBER)
        assert call(other, "delete", f"{s.url}/issues/{product.id}/").status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
class TestExclusions:
    def test_cycles_and_modules(self, s):
        product = create(s)
        ids = {"issues": [str(product.id)]}
        cycle = Cycle.objects.create(project=s.project, workspace=s.ws, name="C", owned_by=s.root)
        module = Module.objects.create(project=s.project, workspace=s.ws, name="M")
        for url in (
            f"{s.url}/cycles/{cycle.id}/cycle-issues/",
            f"{s.url}/modules/{module.id}/issues/",
            f"{s.v1}/cycles/{cycle.id}/cycle-issues/",
            f"{s.v1}/modules/{module.id}/module-issues/",
        ):
            assert call(s.root, "post", url, ids).status_code == 400, url
        url = f"{s.url}/issues/{product.id}/modules/"
        assert call(s.root, "post", url, {"modules": [str(module.id)]}).status_code == 400

    def test_automation(self, s):
        product, plain = create(s), task(s)
        done, plain_done = create(s), task(s, group="completed")
        Issue.objects.filter(pk=done.pk).update(state=s.states["completed"])
        Project.objects.filter(pk=s.project.pk).update(archive_in=1, close_in=1, default_state=s.states["cancelled"])
        Issue.objects.update(updated_at=timezone.now() - timedelta(days=100))
        with mock.patch("plane.bgtasks.issue_automation_task.issue_activity"):
            archive_old_issues()
            close_old_issues()
        assert Issue.objects.get(pk=plain.pk).state_id == s.states["cancelled"].id
        assert Issue.objects.get(pk=plain_done.pk).archived_at is not None
        assert Issue.objects.get(pk=product.pk).state_id != s.states["cancelled"].id
        assert Issue.objects.get(pk=done.pk).archived_at is None

    def test_intake_has_tasks_only(self, s):
        Project.objects.filter(pk=s.project.pk).update(intake_view=True)
        from plane.db.models import Intake

        Intake.objects.create(project=s.project, workspace=s.ws, name="I", is_default=True)
        response = call(s.member, "post", f"{s.url}/intake-issues/", {"issue": dict(s.body)})
        assert response.status_code == 400


@pytest.mark.contract
@pytest.mark.django_db
class TestLists:
    def test_filter_group_and_sub_issue_toggle(self, s):
        product = create(s)
        child, plain = task(s, product), task(s)
        nested = task(s, child)
        get = lambda query: call(s.member, "get", f"{s.url}/issues/?{urlencode(query)}").data  # noqa: E731
        ids = lambda data: {str(row["id"]) for row in data["results"]}  # noqa: E731
        assert ids(get({"filters": '{"kind": "product"}'})) == {str(product.id)}
        assert ids(get({"filters": '{"kind__in": "task"}'})) == {str(i.id) for i in (child, plain, nested)}
        assert ids(get({"sub_issue": "false"})) == {str(i.id) for i in (product, child, plain)}
        grouped = get({"group_by": "type__kind"})["results"]
        assert grouped["product"]["total_results"] == 1
        assert grouped["None"]["total_results"] == 3

    def test_products_of_a_portfolio(self, s):
        product = create(s)
        task(s, product, "completed")
        task(s, product, "started", target_date=timezone.now().date() - timedelta(days=5))
        task(s, product, "cancelled")
        url = f"/api/workspaces/{s.ws.slug}/products/?portfolio_id={s.portfolio.id}"
        row = call(s.member, "get", url).data[0]
        assert (row["total_tasks"], row["completed_tasks"], row["progress"]) == (2, 1, 50)
        assert row["product_type_id"] == s.type.id
        assert call(s.outsider, "get", url).data == []
        assert call(s.guest, "get", url).status_code == 403

    def test_query_count_does_not_grow(self, s):
        url = f"/api/workspaces/{s.ws.slug}/products/?team_id={s.team.id}"
        for path in (url, f"{s.v1}/work-items/", f"{s.url}/issues-detail/"):
            create(s)
            with CaptureQueriesContext(connection) as first:
                call(s.member, "get", path)
            for _ in range(3):
                task(s, create(s))
            with CaptureQueriesContext(connection) as second:
                call(s.member, "get", path)
            if path == f"{s.v1}/work-items/":
                continue  # assignees and labels were already read one by one there
            assert len(second) <= len(first), path


@pytest.mark.contract
@pytest.mark.django_db
class TestProductTypes:
    def test_rights_and_initial_list(self, s):
        url = f"/api/workspaces/{s.ws.slug}/product-types/"
        assert len(call(s.member, "get", url).data) == 3
        assert call(s.guest, "get", url).status_code == 403
        assert call(s.member, "post", url, {"name": "X"}).status_code == 403
        assert call(s.root, "post", url, {"name": "Датасет"}).status_code == 400
        created = call(s.root, "post", url, {"name": "X", "requirements_html": "<p>a</p><script>b</script>"})
        assert created.status_code == 201
        assert "<script" not in created.data["requirements_html"]
        assert call(s.member, "patch", f"{url}{created.data['id']}/", {"name": "Z"}).status_code == 403

    def test_delete(self, s):
        url = f"/api/workspaces/{s.ws.slug}/product-types/"
        product = create(s)
        assert call(s.root, "delete", f"{url}{s.type.id}/").status_code == 400
        assert call(s.root, "patch", f"{url}{s.type.id}/", {"is_active": False}).status_code == 200
        # A disabled type stays on the products that have it.
        assert patch(s, product, {"product": {"product_type_id": str(s.type.id)}}).status_code == 204
        unused = ProductType.objects.get(workspace=s.ws, name="Аналитическая записка")
        assert call(s.root, "delete", f"{url}{unused.id}/").status_code == 204
        assert len(call(s.root, "get", url).data) == 2
