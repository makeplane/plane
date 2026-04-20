# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status
from uuid import uuid4

from plane.app.permissions import ROLE
from plane.db.models import Project, ProjectMember, State, User, Workspace, WorkspaceMember
from plane.ee.models import (
    ProjectFeature,
    Workflow,
    WorkflowState,
    WorkflowStateType,
    WorkflowTransition,
    WorkflowTransitionApprover,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def workspace(db, create_user):
    ws = Workspace.objects.create(
        name="Test Workspace",
        slug=f"wf-ws-{uuid4().hex[:8]}",
        owner=create_user,
    )
    WorkspaceMember.objects.create(
        workspace=ws,
        member=create_user,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return ws


@pytest.fixture
def project(db, workspace, create_user):
    proj = Project.objects.create(
        name="Test Project",
        identifier=f"W{uuid4().hex[:3].upper()}",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=proj,
        member=create_user,
        workspace=workspace,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return proj


@pytest.fixture
def project_feature(db, workspace, project, create_user):
    return ProjectFeature.objects.create(
        project=project,
        workspace=workspace,
        is_workflow_enabled=True,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def workflow(db, workspace, project, create_user):
    return Workflow.objects.create(
        name="Test Workflow",
        project=project,
        workspace=workspace,
        is_active=False,
        is_default=False,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def default_workflow(db, workspace, project, create_user):
    return Workflow.objects.create(
        name="Default Workflow",
        project=project,
        workspace=workspace,
        is_active=True,
        is_default=True,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def state(db, workspace, project, create_user):
    return State.objects.create(
        name="In Progress",
        color="#FF5733",
        group="started",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def target_state(db, workspace, project, create_user):
    return State.objects.create(
        name="Done",
        color="#00FF00",
        group="completed",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def rejection_state(db, workspace, project, create_user):
    return State.objects.create(
        name="Backlog",
        color="#AAAAAA",
        group="backlog",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def workflow_state_transition(db, workspace, project, workflow, state, create_user):
    return WorkflowState.objects.create(
        state=state,
        workflow=workflow,
        project=project,
        workspace=workspace,
        type=WorkflowStateType.TRANSITION,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def workflow_state_approval(db, workspace, project, workflow, state, create_user):
    return WorkflowState.objects.create(
        state=state,
        workflow=workflow,
        project=project,
        workspace=workspace,
        type=WorkflowStateType.APPROVAL,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def transition(db, workspace, project, workflow_state_transition, target_state, create_user):
    return WorkflowTransition.objects.create(
        workflow_state=workflow_state_transition,
        transition_state=target_state,
        project=project,
        workspace=workspace,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def approver_user(db, workspace):
    user = User.objects.create(
        email=f"approver-{uuid4().hex[:6]}@plane.so",
        first_name="Approver",
        last_name="User",
    )
    user.set_password("password")
    user.save()
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=user,
        role=ROLE.MEMBER.value,
        is_active=True,
    )
    return user


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

WORKFLOW_ACTIVITY_PATH = "plane.ee.bgtasks.workflow_activity_task.workflow_activity.delay"
FEATURE_FLAG_PATH = "plane.payment.flags.flag_decorator.check_workspace_feature_flag"


# ---------------------------------------------------------------------------
# WorkflowListCreateAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkflowListCreateAPIEndpoint:
    def test_list_workflows(self, api_key_client, workspace, project, workflow, create_project_member_admin):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse("project-workflows", kwargs={"slug": workspace.slug, "project_id": project.id})
            response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        ids = [str(w["id"]) for w in response.data]
        assert str(workflow.id) in ids

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_workflow(
        self, mock_activity, api_key_client, workspace, project, project_feature, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse("project-workflows", kwargs={"slug": workspace.slug, "project_id": project.id})
            response = api_key_client.post(url, {"name": "New Workflow"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Workflow"
        assert Workflow.objects.filter(id=response.data["id"]).exists()

    def test_create_workflow_requires_multiple_workflows_flag(
        self, api_key_client, workspace, project, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=False):
            url = reverse("project-workflows", kwargs={"slug": workspace.slug, "project_id": project.id})
            response = api_key_client.post(url, {"name": "New Workflow"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_workflow_requires_project_feature_enabled(
        self, mock_activity, api_key_client, workspace, project, create_project_member_admin
    ):
        # project_feature fixture NOT included → is_workflow_enabled defaults to False
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse("project-workflows", kwargs={"slug": workspace.slug, "project_id": project.id})
            response = api_key_client.post(url, {"name": "New Workflow"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# WorkflowDetailAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkflowDetailAPIEndpoint:
    def test_get_workflow(self, api_key_client, workspace, project, workflow, create_project_member_admin):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-detail", kwargs={"slug": workspace.slug, "project_id": project.id, "pk": workflow.id}
            )
            response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(workflow.id)

    def test_get_workflow_not_found(self, api_key_client, workspace, project, create_project_member_admin):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-detail", kwargs={"slug": workspace.slug, "project_id": project.id, "pk": uuid4()}
            )
            response = api_key_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_patch_workflow(
        self, mock_activity, api_key_client, workspace, project, default_workflow, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-detail",
                kwargs={"slug": workspace.slug, "project_id": project.id, "pk": default_workflow.id},
            )
            response = api_key_client.patch(url, {"name": "Renamed Workflow"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Renamed Workflow"

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_delete_non_default_workflow(
        self, mock_activity, api_key_client, workspace, project, workflow, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-detail", kwargs={"slug": workspace.slug, "project_id": project.id, "pk": workflow.id}
            )
            response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_delete_default_workflow_rejected(
        self, mock_activity, api_key_client, workspace, project, default_workflow, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-detail",
                kwargs={"slug": workspace.slug, "project_id": project.id, "pk": default_workflow.id},
            )
            response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# WorkflowStatesAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkflowStatesAPIEndpoint:
    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_add_states_to_workflow(
        self, mock_activity, api_key_client, workspace, project, workflow, state, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-states",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            response = api_key_client.post(url, {"state_ids": [str(state.id)]}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert WorkflowState.objects.filter(workflow=workflow, state=state).exists()

    def test_add_states_requires_state_ids(
        self, api_key_client, workspace, project, workflow, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-states",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            response = api_key_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_patch_state_type_change_deletes_existing_transitions(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        transition,
        create_project_member_admin,
    ):
        """Switching WorkflowState type must wipe all existing transitions."""
        assert WorkflowTransition.objects.filter(workflow_state=workflow_state_transition).exists()

        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "state_id": workflow_state_transition.state_id,
                },
            )
            response = api_key_client.patch(url, {"type": WorkflowStateType.APPROVAL}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert not WorkflowTransition.objects.filter(workflow_state=workflow_state_transition).exists()

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_patch_state_without_type_change_keeps_transitions(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        transition,
        create_project_member_admin,
    ):
        """Updating a state without changing type must not delete transitions."""
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "state_id": workflow_state_transition.state_id,
                },
            )
            response = api_key_client.patch(url, {"allow_issue_creation": False}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert WorkflowTransition.objects.filter(workflow_state=workflow_state_transition).exists()

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_delete_workflow_state(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "state_id": workflow_state_transition.state_id,
                },
            )
            response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_delete_default_workflow_state_rejected(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        default_workflow,
        state,
        create_user,
        create_project_member_admin,
    ):
        ws = WorkflowState.objects.create(
            state=state,
            workflow=default_workflow,
            project=project,
            workspace=workspace,
            type=WorkflowStateType.TRANSITION,
            created_by=create_user,
            updated_by=create_user,
        )
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": default_workflow.id,
                    "state_id": ws.state_id,
                },
            )
            response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# WorkflowStateTransitionsAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkflowStateTransitionsAPIEndpoint:
    # --- POST ---

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_transition_on_transition_type_state(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        target_state,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            payload = {
                "state_id": str(workflow_state_transition.state_id),
                "transition_state_id": str(target_state.id),
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert WorkflowTransition.objects.filter(
            workflow_state=workflow_state_transition,
            transition_state=target_state,
        ).exists()

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_multiple_transitions_on_transition_type_state(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        target_state,
        rejection_state,
        create_project_member_admin,
    ):
        """TRANSITION states allow more than one transition record."""
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            api_key_client.post(
                url,
                {"state_id": str(workflow_state_transition.state_id), "transition_state_id": str(target_state.id)},
                format="json",
            )
            response = api_key_client.post(
                url,
                {"state_id": str(workflow_state_transition.state_id), "transition_state_id": str(rejection_state.id)},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        assert WorkflowTransition.objects.filter(workflow_state=workflow_state_transition).count() == 2

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_transition_on_approval_type_state(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_approval,
        target_state,
        rejection_state,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            payload = {
                "state_id": str(workflow_state_approval.state_id),
                "transition_state_id": str(target_state.id),
                "rejection_state_id": str(rejection_state.id),
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert WorkflowTransition.objects.filter(workflow_state=workflow_state_approval).count() == 1

    def test_create_approval_transition_without_feature_flag_rejected(
        self,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_approval,
        target_state,
        create_project_member_admin,
    ):
        """APPROVAL transitions require MULTIPLE_WORKFLOWS feature flag."""

        def flag_side_effect(feature_key, slug, user_id=None):
            from plane.payment.flags.flag import FeatureFlag

            if feature_key == FeatureFlag.MULTIPLE_WORKFLOWS:
                return False
            return True

        with patch(FEATURE_FLAG_PATH, side_effect=flag_side_effect):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            payload = {
                "state_id": str(workflow_state_approval.state_id),
                "transition_state_id": str(target_state.id),
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_second_approval_transition_rejected(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_approval,
        target_state,
        rejection_state,
        create_user,
        create_project_member_admin,
    ):
        """APPROVAL state must only have one transition — second POST must be rejected."""
        WorkflowTransition.objects.create(
            workflow_state=workflow_state_approval,
            transition_state=target_state,
            project=project,
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )

        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            payload = {
                "state_id": str(workflow_state_approval.state_id),
                "transition_state_id": str(rejection_state.id),
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "approval state" in response.data.get("error", "").lower()

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_duplicate_transition_rejected(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        transition,
        create_project_member_admin,
    ):
        """Creating a transition with the same transition_state_id is rejected."""
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            payload = {
                "state_id": str(workflow_state_transition.state_id),
                "transition_state_id": str(transition.transition_state_id),
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_create_transition_with_approvers(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_approval,
        target_state,
        approver_user,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            payload = {
                "state_id": str(workflow_state_approval.state_id),
                "transition_state_id": str(target_state.id),
                "member_ids": [str(approver_user.id)],
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        transition_id = response.data["id"]
        assert WorkflowTransitionApprover.objects.filter(
            workflow_transition_id=transition_id,
            approver=approver_user,
        ).exists()

    def test_create_transition_workflow_state_not_found(
        self, api_key_client, workspace, project, workflow, target_state, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transitions",
                kwargs={"slug": workspace.slug, "project_id": project.id, "workflow_id": workflow.id},
            )
            payload = {
                "state_id": str(uuid4()),  # non-existent state
                "transition_state_id": str(target_state.id),
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    # --- PATCH ---

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_patch_transition(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        transition,
        rejection_state,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transition-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "transition_id": transition.id,
                },
            )
            response = api_key_client.patch(url, {"rejection_state_id": str(rejection_state.id)}, format="json")

        assert response.status_code == status.HTTP_200_OK
        transition.refresh_from_db()
        assert str(transition.rejection_state_id) == str(rejection_state.id)

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_patch_transition_update_approvers(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        transition,
        approver_user,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transition-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "transition_id": transition.id,
                },
            )
            response = api_key_client.patch(url, {"member_ids": [str(approver_user.id)]}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert WorkflowTransitionApprover.objects.filter(
            workflow_transition=transition,
            approver=approver_user,
        ).exists()

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_patch_transition_remove_approvers(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        transition,
        approver_user,
        create_user,
        create_project_member_admin,
    ):
        WorkflowTransitionApprover.objects.create(
            workflow_transition=transition,
            workflow_state=workflow_state_transition,
            approver=approver_user,
            project=project,
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )

        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transition-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "transition_id": transition.id,
                },
            )
            # Pass empty list to remove all approvers
            response = api_key_client.patch(url, {"member_ids": []}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert not WorkflowTransitionApprover.objects.filter(workflow_transition=transition).exists()

    def test_patch_transition_not_found(
        self, api_key_client, workspace, project, workflow, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transition-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "transition_id": uuid4(),
                },
            )
            response = api_key_client.patch(url, {"rejection_state_id": str(uuid4())}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    # --- DELETE ---

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_delete_transition(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        transition,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transition-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "transition_id": transition.id,
                },
            )
            response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not WorkflowTransition.objects.filter(id=transition.id).exists()

    def test_delete_transition_not_found(
        self, api_key_client, workspace, project, workflow, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transition-detail",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "transition_id": uuid4(),
                },
            )
            response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# WorkflowStateTransferAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkflowStateTransferAPIEndpoint:
    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_transfer_state(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        target_state,
        create_user,
        create_project_member_admin,
    ):
        target_ws = WorkflowState.objects.create(
            state=target_state,
            workflow=workflow,
            project=project,
            workspace=workspace,
            type=WorkflowStateType.TRANSITION,
            created_by=create_user,
            updated_by=create_user,
        )
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transfer",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "state_id": workflow_state_transition.state_id,
                },
            )
            response = api_key_client.post(url, {"new_state_id": str(target_ws.state_id)}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert not WorkflowState.objects.filter(id=workflow_state_transition.id).exists()

    def test_transfer_state_same_state_rejected(
        self,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        create_project_member_admin,
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transfer",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "state_id": workflow_state_transition.state_id,
                },
            )
            response = api_key_client.post(
                url, {"new_state_id": str(workflow_state_transition.state_id)}, format="json"
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch(WORKFLOW_ACTIVITY_PATH)
    def test_transfer_state_referenced_in_transition_rejected(
        self,
        mock_activity,
        api_key_client,
        workspace,
        project,
        workflow,
        workflow_state_transition,
        transition,
        target_state,
        create_user,
        create_project_member_admin,
    ):
        """Cannot transfer a state that is referenced as a transition target."""
        target_ws = WorkflowState.objects.create(
            state=target_state,
            workflow=workflow,
            project=project,
            workspace=workspace,
            type=WorkflowStateType.TRANSITION,
            created_by=create_user,
            updated_by=create_user,
        )
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transfer",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    # transition.transition_state_id == target_state, so target_ws is referenced
                    "state_id": target_ws.state_id,
                },
            )
            response = api_key_client.post(
                url, {"new_state_id": str(workflow_state_transition.state_id)}, format="json"
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_transfer_state_not_found(
        self, api_key_client, workspace, project, workflow, target_state, create_project_member_admin
    ):
        with patch(FEATURE_FLAG_PATH, return_value=True):
            url = reverse(
                "project-workflow-state-transfer",
                kwargs={
                    "slug": workspace.slug,
                    "project_id": project.id,
                    "workflow_id": workflow.id,
                    "state_id": uuid4(),
                },
            )
            response = api_key_client.post(url, {"new_state_id": str(target_state.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
