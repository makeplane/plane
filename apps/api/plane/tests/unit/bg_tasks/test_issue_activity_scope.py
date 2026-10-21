# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""issue_activity only records objects from the activity's own project/workspace;
ids outside that scope are skipped."""

import json
from unittest import mock

import pytest
from django.utils import timezone

from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Cycle,
    Estimate,
    EstimatePoint,
    Issue,
    IssueActivity,
    IssueSubscriber,
    Label,
    Module,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)

pytestmark = pytest.mark.unit


@pytest.fixture
def scope(db, workspace, create_user):
    project = Project.objects.create(name="Home", identifier="HOME", workspace=workspace, created_by=create_user)
    issue = Issue.objects.create(name="Home issue", project=project, workspace=workspace)
    sibling = Issue.objects.create(name="Sibling issue", project=project, workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)

    # Same workspace, but not a member of this project
    bystander = User.objects.create(email="bystander@plane.so", username="bystander", display_name="bystander-name")
    WorkspaceMember.objects.create(workspace=workspace, member=bystander, role=15)

    outsider = User.objects.create(email="outsider@plane.so", username="outsider", display_name="outsider-name")
    other_ws = Workspace.objects.create(name="Other", owner=outsider, slug="other-ws")
    WorkspaceMember.objects.create(workspace=other_ws, member=outsider, role=20)
    other_project = Project.objects.create(name="Other", identifier="OTH", workspace=other_ws, created_by=outsider)

    return {
        "user": create_user,
        "project": project,
        "issue": issue,
        "sibling": sibling,
        "archived": Issue.objects.create(
            name="Archived issue", project=project, workspace=workspace, archived_at=timezone.now().date()
        ),
        "bystander": bystander,
        "label": Label.objects.create(name="home-label", project=project, workspace=workspace),
        "outsider": outsider,
        "foreign_issue": Issue.objects.create(name="Foreign issue", project=other_project, workspace=other_ws),
        "foreign_label": Label.objects.create(name="foreign-label", project=other_project, workspace=other_ws),
        "foreign_module": Module.objects.create(name="foreign-module", project=other_project, workspace=other_ws),
        "foreign_cycle": Cycle.objects.create(
            name="foreign-cycle", project=other_project, workspace=other_ws, owned_by=outsider
        ),
    }


def _run(scope, type, requested_data, current_instance=None, issue_id=None):
    issue_activity(
        type=type,
        requested_data=json.dumps(requested_data),
        current_instance=json.dumps(current_instance) if current_instance is not None else None,
        issue_id=str(issue_id or scope["issue"].id),
        actor_id=str(scope["user"].id),
        project_id=str(scope["project"].id),
        epoch=int(timezone.now().timestamp()),
    )


def _refs(*objs):
    """Activity rows that point at any of objs by issue, identifier or value."""
    ids = [o.id for o in objs]
    names = [o.name for o in objs]
    return (
        IssueActivity.objects.filter(issue_id__in=ids)
        | IssueActivity.objects.filter(old_identifier__in=ids)
        | IssueActivity.objects.filter(new_identifier__in=ids)
        | IssueActivity.objects.filter(new_value__in=names)
        | IssueActivity.objects.filter(old_value__in=names)
    )


def test_relation_activity_skips_issues_outside_workspace(scope):
    foreign, sibling = scope["foreign_issue"], scope["sibling"]
    _run(
        scope,
        "issue_relation.activity.created",
        {"relation_type": "relates_to", "issues": [str(foreign.id), str(sibling.id)]},
    )

    assert not _refs(foreign).exists()
    assert IssueActivity.objects.filter(issue=scope["issue"], old_identifier=sibling.id).exists()
    assert IssueActivity.objects.filter(issue=sibling, old_identifier=scope["issue"].id).exists()


def test_relation_activity_skips_activity_issue_outside_project(scope):
    foreign, sibling = scope["foreign_issue"], scope["sibling"]
    _run(
        scope,
        "issue_relation.activity.created",
        {"relation_type": "relates_to", "issues": [str(sibling.id)]},
        issue_id=foreign.id,
    )
    _run(
        scope,
        "issue_relation.activity.deleted",
        {"relation_type": "relates_to", "related_issue": str(sibling.id)},
        {},
        issue_id=foreign.id,
    )

    assert not _refs(foreign, sibling).exists()


@pytest.mark.parametrize(
    "client_fixture,view_module,url",
    [
        (
            "session_client",
            "plane.app.views.issue.relation",
            "/api/workspaces/{slug}/projects/{project}/issues/{issue}/issue-relation/",
        ),
        (
            "api_key_client",
            "plane.api.views.issue",
            "/api/v1/workspaces/{slug}/projects/{project}/work-items/{issue}/relations/",
        ),
    ],
)
def test_relation_activity_only_covers_related_issues(scope, request, client_fixture, view_module, url):
    issue, sibling, archived = scope["issue"], scope["sibling"], scope["archived"]
    client = request.getfixturevalue(client_fixture)
    with (
        mock.patch(f"{view_module}.issue_activity") as task,
        mock.patch(f"{view_module}.base_host", return_value="http://testserver"),
    ):
        response = client.post(
            url.format(slug=scope["project"].workspace.slug, project=scope["project"].id, issue=issue.id),
            {"relation_type": "relates_to", "issues": [str(archived.id), str(sibling.id)]},
            format="json",
        )
    assert response.status_code == 201, response.data
    issue_activity(**{**task.delay.call_args.kwargs, "notification": False, "origin": None})

    assert not _refs(archived).exists()
    assert IssueActivity.objects.filter(issue=issue, old_identifier=sibling.id).exists()


def test_label_activity_skips_labels_outside_project(scope):
    label, foreign_label = scope["label"], scope["foreign_label"]
    _run(
        scope,
        "issue.activity.updated",
        {"label_ids": [str(foreign_label.id), str(label.id)]},
        {"label_ids": []},
    )

    assert not _refs(foreign_label).exists()
    assert IssueActivity.objects.filter(issue=scope["issue"], field="labels", new_identifier=label.id).exists()


def test_assignee_activity_skips_users_outside_workspace(scope):
    user, outsider = scope["user"], scope["outsider"]
    _run(
        scope,
        "issue.activity.updated",
        {"assignee_ids": [str(outsider.id), str(user.id)]},
        {"assignee_ids": []},
    )

    assert not IssueActivity.objects.filter(field="assignees", new_identifier=outsider.id).exists()
    assert not IssueActivity.objects.filter(new_value=outsider.display_name).exists()
    assert not IssueSubscriber.objects.filter(subscriber=outsider).exists()
    assert IssueActivity.objects.filter(issue=scope["issue"], field="assignees", new_identifier=user.id).exists()


def test_assignee_activity_requires_project_membership(scope):
    bystander = scope["bystander"]
    _run(scope, "issue.activity.updated", {"assignee_ids": [str(bystander.id)]}, {"assignee_ids": []})

    assert not IssueActivity.objects.filter(field="assignees", new_identifier=bystander.id).exists()
    assert not IssueSubscriber.objects.filter(subscriber=bystander).exists()


def test_parent_activity_skips_issues_outside_project(scope):
    _run(scope, "issue.activity.updated", {"parent_id": str(scope["foreign_issue"].id)}, {"parent_id": None})
    assert not IssueActivity.objects.filter(field="parent").exists()

    _run(scope, "issue.activity.updated", {"parent_id": str(scope["sibling"].id)}, {"parent_id": None})
    assert IssueActivity.objects.filter(field="parent", new_identifier=scope["sibling"].id).exists()


def test_module_and_cycle_activity_skip_objects_outside_project(scope):
    _run(scope, "module.activity.created", {"module_id": str(scope["foreign_module"].id)})
    _run(
        scope,
        "cycle.activity.deleted",
        {"cycle_id": str(scope["foreign_cycle"].id), "issues": [str(scope["foreign_issue"].id)]},
    )

    assert not _refs(scope["foreign_module"], scope["foreign_cycle"], scope["foreign_issue"]).exists()


def _estimate_point(project, value):
    estimate = Estimate.objects.create(name=f"{project.identifier} pts", project=project, workspace=project.workspace)
    return EstimatePoint.objects.create(estimate=estimate, value=value, project=project, workspace=project.workspace)


def test_estimate_activity_skips_points_outside_project(scope):
    foreign_point = _estimate_point(scope["foreign_issue"].project, "13")
    home_point = _estimate_point(scope["project"], "3")

    _run(scope, "issue.activity.updated", {"estimate_point": str(foreign_point.id)}, {"estimate_point": None})
    assert not IssueActivity.objects.filter(field__startswith="estimate_").exists()

    _run(scope, "issue.activity.updated", {"estimate_point": str(home_point.id)}, {"estimate_point": None})
    assert IssueActivity.objects.filter(
        issue=scope["issue"], field__startswith="estimate_", new_identifier=home_point.id
    ).exists()


def test_assignee_removal_recorded_for_deactivated_member(scope):
    workspace = scope["project"].workspace
    former = User.objects.create(email="former@plane.so", username="former", display_name="former-name")
    WorkspaceMember.objects.create(workspace=workspace, member=former, role=15, is_active=False)
    ProjectMember.objects.create(project=scope["project"], member=former, workspace=workspace, role=15, is_active=False)

    _run(scope, "issue.activity.updated", {"assignee_ids": []}, {"assignee_ids": [str(former.id)]})

    assert IssueActivity.objects.filter(issue=scope["issue"], field="assignees", old_identifier=former.id).exists()


def test_relation_delete_recorded_across_projects_in_workspace(scope):
    workspace = scope["project"].workspace
    neighbour_project = Project.objects.create(
        name="Neighbour", identifier="NBR", workspace=workspace, created_by=scope["user"]
    )
    neighbour = Issue.objects.create(name="Neighbour issue", project=neighbour_project, workspace=workspace)

    _run(
        scope,
        "issue_relation.activity.deleted",
        {"relation_type": "relates_to", "related_issue": str(neighbour.id)},
        {},
    )

    assert IssueActivity.objects.filter(issue=scope["issue"], verb="deleted", old_identifier=neighbour.id).exists()
    assert IssueActivity.objects.filter(issue=neighbour, verb="deleted", field="relates_to").exists()
