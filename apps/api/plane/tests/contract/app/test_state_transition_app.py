# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import (
    Issue,
    Project,
    ProjectMember,
    State,
    StateGroup,
    StateTransition,
    User,
    WorkspaceMember,
)


@pytest.mark.contract
class TestStateTransitionEndpoint:
    """Contract coverage for the project state-transitions endpoint."""

    @pytest.fixture
    def workflow_context(self, workspace, create_user):
        project = Project.objects.create(name="Workflow project", identifier="WFP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20)

        member = User.objects.create_user(email="wf-member@plane.so", username="wf_member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        ProjectMember.objects.create(project=project, member=member, role=15)

        def make_state(name, group=StateGroup.UNSTARTED.value):
            return State.objects.create(
                name=name, color="#000000", group=group, project=project, workspace=workspace
            )

        todo = make_state("Todo")
        in_progress = make_state("In Progress", StateGroup.STARTED.value)
        done = make_state("Done", StateGroup.COMPLETED.value)

        return {
            "project": project,
            "member": member,
            "todo": todo,
            "in_progress": in_progress,
            "done": done,
        }

    @staticmethod
    def get_url(workspace_slug, project_id):
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/state-transitions/"

    @pytest.mark.django_db
    def test_get_returns_transition_map(self, session_client, workspace, workflow_context):
        ctx = workflow_context
        StateTransition.objects.create(
            project=ctx["project"],
            workspace=workspace,
            from_state=ctx["todo"],
            to_state=ctx["in_progress"],
        )

        response = session_client.get(self.get_url(workspace.slug, ctx["project"].id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {str(ctx["todo"].id): [str(ctx["in_progress"].id)]}

    @pytest.mark.django_db
    def test_admin_can_bulk_replace(self, session_client, workspace, workflow_context):
        ctx = workflow_context
        url = self.get_url(workspace.slug, ctx["project"].id)

        payload = {
            "transitions": {
                str(ctx["todo"].id): [str(ctx["in_progress"].id), str(ctx["done"].id)],
            }
        }
        response = session_client.put(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK, response.data
        assert set(response.data[str(ctx["todo"].id)]) == {str(ctx["in_progress"].id), str(ctx["done"].id)}

        # Replace with a narrower set
        payload = {"transitions": {str(ctx["todo"].id): [str(ctx["in_progress"].id)]}}
        response = session_client.put(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data[str(ctx["todo"].id)] == [str(ctx["in_progress"].id)]

        # Empty list clears the config (back to allow-all)
        payload = {"transitions": {str(ctx["todo"].id): []}}
        response = session_client.put(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert str(ctx["todo"].id) not in response.data
        assert StateTransition.objects.filter(project=ctx["project"]).count() == 0

    @pytest.mark.django_db
    def test_member_cannot_update(self, session_client, workspace, workflow_context):
        ctx = workflow_context
        session_client.force_authenticate(user=ctx["member"])

        payload = {"transitions": {str(ctx["todo"].id): [str(ctx["done"].id)]}}
        response = session_client.put(self.get_url(workspace.slug, ctx["project"].id), payload, format="json")

        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED)

    @pytest.mark.django_db
    def test_member_can_read(self, session_client, workspace, workflow_context):
        ctx = workflow_context
        session_client.force_authenticate(user=ctx["member"])

        response = session_client.get(self.get_url(workspace.slug, ctx["project"].id))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_rejects_foreign_state(self, session_client, workspace, workflow_context):
        ctx = workflow_context
        other_project = Project.objects.create(name="Other project", identifier="OTH", workspace=workspace)
        foreign_state = State.objects.create(
            name="Foreign", color="#000000", project=other_project, workspace=workspace
        )

        payload = {"transitions": {str(ctx["todo"].id): [str(foreign_state.id)]}}
        response = session_client.put(self.get_url(workspace.slug, ctx["project"].id), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_rejects_self_transition(self, session_client, workspace, workflow_context):
        ctx = workflow_context
        payload = {"transitions": {str(ctx["todo"].id): [str(ctx["todo"].id)]}}
        response = session_client.put(self.get_url(workspace.slug, ctx["project"].id), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestIssueStateTransitionEnforcement:
    """Issue updates must respect the configured workflow."""

    @pytest.fixture
    def enforcement_context(self, workspace, create_user):
        project = Project.objects.create(name="Enforced project", identifier="ENF", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20)

        todo = State.objects.create(
            name="Todo", color="#000000", group=StateGroup.UNSTARTED.value, project=project, workspace=workspace
        )
        in_progress = State.objects.create(
            name="In Progress",
            color="#000000",
            group=StateGroup.STARTED.value,
            project=project,
            workspace=workspace,
        )
        done = State.objects.create(
            name="Done", color="#000000", group=StateGroup.COMPLETED.value, project=project, workspace=workspace
        )

        issue = Issue.objects.create(name="Enforced issue", project=project, workspace=workspace, state=todo)

        StateTransition.objects.create(
            project=project, workspace=workspace, from_state=todo, to_state=in_progress
        )

        return {
            "project": project,
            "issue": issue,
            "todo": todo,
            "in_progress": in_progress,
            "done": done,
        }

    @staticmethod
    def get_url(workspace_slug, project_id, issue_id):
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/"

    @pytest.mark.django_db
    def test_allowed_transition_succeeds(self, session_client, workspace, enforcement_context):
        ctx = enforcement_context
        response = session_client.patch(
            self.get_url(workspace.slug, ctx["project"].id, ctx["issue"].id),
            {"state_id": str(ctx["in_progress"].id)},
            format="json",
        )
        assert response.status_code in (status.HTTP_200_OK, status.HTTP_204_NO_CONTENT)
        ctx["issue"].refresh_from_db()
        assert ctx["issue"].state_id == ctx["in_progress"].id

    @pytest.mark.django_db
    def test_disallowed_transition_rejected(self, session_client, workspace, enforcement_context):
        ctx = enforcement_context
        response = session_client.patch(
            self.get_url(workspace.slug, ctx["project"].id, ctx["issue"].id),
            {"state_id": str(ctx["done"].id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data.get("error_code") == "STATE_TRANSITION_NOT_ALLOWED"
        ctx["issue"].refresh_from_db()
        assert ctx["issue"].state_id == ctx["todo"].id

    @pytest.mark.django_db
    def test_allow_any_transition_bypasses_config(self, session_client, workspace, enforcement_context):
        ctx = enforcement_context
        ctx["done"].allow_any_transition = True
        ctx["done"].save()

        response = session_client.patch(
            self.get_url(workspace.slug, ctx["project"].id, ctx["issue"].id),
            {"state_id": str(ctx["done"].id)},
            format="json",
        )
        assert response.status_code in (status.HTTP_200_OK, status.HTTP_204_NO_CONTENT)
        ctx["issue"].refresh_from_db()
        assert ctx["issue"].state_id == ctx["done"].id
