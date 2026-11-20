# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public API workspace work item count endpoint."""

from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Issue,
    IssueLabel,
    Label,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)

ADMIN, MEMBER, GUEST = 20, 15, 5

EXPECTED_COUNT_KEYS = {
    "grouped_by",
    "sub_grouped_by",
    "total_count",
    "grouped_counts",
}


def _make_user(workspace, project, ws_role, project_role):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"u-{uid}@plane.so", username=f"u_{uid}")
    user.set_password("test-password")
    user.save()
    if ws_role is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role, is_active=True)
    if project is not None and project_role is not None:
        ProjectMember.objects.create(
            project=project, member=user, workspace=workspace, role=project_role, is_active=True
        )
    return user


@pytest.fixture
def client_for():
    def _factory(user):
        token = APIToken.objects.create(user=user, label="t")
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)
        return client

    return _factory


def _project(workspace, owner, identifier, guest_view_all=True):
    project = Project.objects.create(
        name=identifier,
        identifier=identifier,
        workspace=workspace,
        created_by=owner,
        guest_view_all_features=guest_view_all,
    )
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=ADMIN, is_active=True)
    State.objects.create(name="Backlog", project=project, workspace=workspace, group="backlog", default=True)
    return project


@pytest.fixture
def project_a(workspace, create_user):
    return _project(workspace, create_user, "PRJA")


@pytest.fixture
def project_b(workspace, create_user):
    return _project(workspace, create_user, "PRJB")


def _count_url(workspace):
    return f"/api/v1/workspaces/{workspace.slug}/work-items/count/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemCount:
    def test_unfiltered_and_grouped_counts(self, api_key_client, workspace, project_a, create_user):
        started_state = State.objects.create(
            name="In Progress", project=project_a, workspace=workspace, group="started"
        )
        i1 = Issue(
            name="Urgent 1",
            project=project_a,
            workspace=workspace,
            priority="urgent",
            target_date="2026-11-01",
        )
        i1.save(created_by_id=create_user.id)
        i2 = Issue(
            name="Urgent 2",
            project=project_a,
            workspace=workspace,
            priority="urgent",
            state=started_state,
        )
        i2.save(created_by_id=create_user.id)
        i3 = Issue(name="Low 1", project=project_a, workspace=workspace, priority="low")
        i3.save(created_by_id=create_user.id)

        resp = api_key_client.get(_count_url(workspace))
        assert resp.status_code == status.HTTP_200_OK
        body = resp.json()
        assert set(body.keys()) == EXPECTED_COUNT_KEYS
        assert body == {
            "grouped_by": None,
            "sub_grouped_by": None,
            "total_count": 3,
            "grouped_counts": {},
        }

        grp_resp = api_key_client.get(f"{_count_url(workspace)}?group_by=priority")
        assert grp_resp.status_code == status.HTTP_200_OK
        assert grp_resp.json() == {
            "grouped_by": "priority",
            "sub_grouped_by": None,
            "total_count": 3,
            "grouped_counts": {
                "urgent": {"count": 2},
                "low": {"count": 1},
            },
        }

        date_resp = api_key_client.get(f"{_count_url(workspace)}?group_by=target_date")
        assert date_resp.status_code == status.HTTP_200_OK
        assert date_resp.json()["grouped_counts"] == {
            "2026-11-01": {"count": 1},
            "None": {"count": 2},
        }

        sub_resp = api_key_client.get(f"{_count_url(workspace)}?group_by=priority&sub_group_by=state__group")
        assert sub_resp.status_code == status.HTTP_200_OK
        assert sub_resp.json() == {
            "grouped_by": "priority",
            "sub_grouped_by": "state__group",
            "total_count": 3,
            "grouped_counts": {
                "urgent": {
                    "count": 2,
                    "sub_grouped_counts": {
                        "backlog": {"count": 1},
                        "started": {"count": 1},
                    },
                },
                "low": {
                    "count": 1,
                    "sub_grouped_counts": {
                        "backlog": {"count": 1},
                    },
                },
            },
        }

    def test_m2m_grouping_ignores_soft_deleted_through_rows_and_preserves_distinct_total(
        self, api_key_client, workspace, project_a, create_user
    ):
        label_a = Label.objects.create(name="A", project=project_a, workspace=workspace)
        label_b = Label.objects.create(name="B", project=project_a, workspace=workspace)
        label_deleted = Label.objects.create(name="Deleted", project=project_a, workspace=workspace)

        multi_labeled = Issue(name="Multi", project=project_a, workspace=workspace)
        multi_labeled.save(created_by_id=create_user.id)
        IssueLabel.objects.create(issue=multi_labeled, label=label_a, project=project_a, workspace=workspace)
        IssueLabel.objects.create(issue=multi_labeled, label=label_b, project=project_a, workspace=workspace)

        only_soft_deleted = Issue(name="Soft Deleted Label", project=project_a, workspace=workspace)
        only_soft_deleted.save(created_by_id=create_user.id)
        link = IssueLabel.objects.create(
            issue=only_soft_deleted, label=label_deleted, project=project_a, workspace=workspace
        )
        link.delete()

        resp = api_key_client.get(f"{_count_url(workspace)}?group_by=labels__id")
        assert resp.status_code == status.HTTP_200_OK
        body = resp.json()
        assert body["total_count"] == 2
        assert body["grouped_counts"] == {
            str(label_a.id): {"count": 1},
            str(label_b.id): {"count": 1},
            "None": {"count": 1},
        }

    @pytest.mark.parametrize("quote", ['"', "'"])
    def test_pql_project_scoping_accepted(self, api_key_client, workspace, project_a, project_b, create_user, quote):
        i_a = Issue(name="In A", project=project_a, workspace=workspace)
        i_a.save(created_by_id=create_user.id)
        i_b = Issue(name="In B", project=project_b, workspace=workspace)
        i_b.save(created_by_id=create_user.id)

        pql = f"  project = {quote}{project_a.id}{quote}  "
        resp = api_key_client.get(_count_url(workspace), {"pql": pql})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["total_count"] == 1

    def test_pql_filters_counts(self, api_key_client, workspace, project_a, project_b, create_user):
        urgent = Issue(name="Urgent A", project=project_a, workspace=workspace, priority="urgent")
        urgent.save(created_by_id=create_user.id)
        other = Issue(name="Low B", project=project_b, workspace=workspace, priority="low")
        other.save(created_by_id=create_user.id)

        resp = api_key_client.get(_count_url(workspace), {"pql": f'priority = "urgent" AND project = "{project_a.id}"'})
        assert resp.status_code == status.HTTP_200_OK, resp.content
        assert resp.json()["total_count"] == 1

    @pytest.mark.parametrize("pql", ['() AND project = "x"', 'project = "not-a-uuid"', "milestone IS NULL"])
    def test_invalid_pql_and_filters_return_400(self, api_key_client, workspace, project_a, pql):
        resp = api_key_client.get(_count_url(workspace), {"pql": pql})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "pql" in resp.json()

        f_resp = api_key_client.get(_count_url(workspace), {"filters": '{"priority":"urgent"}'})
        assert f_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert f_resp.json()["unsupported_parameters"] == ["filters"]

    @pytest.mark.parametrize(
        "params",
        [
            {"group_by": "invalid_field"},
            {"group_by": "type_id"},
            {"group_by": "milestone_id"},
            {"group_by": "priority", "sub_group_by": "invalid_field"},
            {"sub_group_by": "priority"},
            {"group_by": "priority", "sub_group_by": "priority"},
        ],
    )
    def test_invalid_grouping_params_return_400(self, api_key_client, workspace, project_a, params):
        resp = api_key_client.get(_count_url(workspace), params)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_visibility_excludes_archived_projects_non_member_projects_and_respects_restricted_guest(
        self, client_for, workspace, project_a, project_b, create_user
    ):
        i_a = Issue(name="A1", project=project_a, workspace=workspace)
        i_a.save(created_by_id=create_user.id)

        # Archived project issue excluded
        Project.objects.filter(pk=project_b.pk).update(archived_at=timezone.now())
        i_b = Issue(name="B1", project=project_b, workspace=workspace)
        i_b.save(created_by_id=create_user.id)

        # Restricted guest in project_a only sees own work items
        Project.objects.filter(pk=project_a.pk).update(guest_view_all_features=False)
        guest = _make_user(workspace, project_a, GUEST, GUEST)
        guest_issue = Issue(name="Guest Own", project=project_a, workspace=workspace)
        guest_issue.save(created_by_id=guest.id)

        resp = client_for(guest).get(_count_url(workspace))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["total_count"] == 1

    def test_cross_project_and_cross_workspace_pql_returns_zero(
        self, api_key_client, workspace, project_a, create_user
    ):
        colleague = User.objects.create(email=f"c-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
        WorkspaceMember.objects.create(workspace=workspace, member=colleague, role=ADMIN, is_active=True)
        sibling_project = _project(workspace, colleague, "SIB")
        sib_issue = Issue(name="Sibling", project=sibling_project, workspace=workspace)
        sib_issue.save(created_by_id=colleague.id)

        other_owner = User.objects.create(email=f"o-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
        other_ws = Workspace.objects.create(name="Other", owner=other_owner, slug=f"other-{uuid4().hex[:8]}")
        WorkspaceMember.objects.create(workspace=other_ws, member=other_owner, role=ADMIN, is_active=True)
        other_project = _project(other_ws, other_owner, "OTH")
        other_issue = Issue(name="Other", project=other_project, workspace=other_ws)
        other_issue.save(created_by_id=other_owner.id)

        for target_pid in (sibling_project.id, other_project.id):
            resp = api_key_client.get(_count_url(workspace), {"pql": f'project = "{target_pid}"'})
            assert resp.status_code == status.HTTP_200_OK
            assert resp.json()["total_count"] == 0

    @pytest.mark.parametrize(
        "ws_role,expected_status",
        [
            (ADMIN, status.HTTP_200_OK),
            (MEMBER, status.HTTP_200_OK),
            (GUEST, status.HTTP_200_OK),
            (None, status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_permission_matrix(self, client_for, workspace, project_a, ws_role, expected_status):
        user = _make_user(workspace, project_a, ws_role, ws_role)
        resp = client_for(user).get(_count_url(workspace))
        assert resp.status_code == expected_status
