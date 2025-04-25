# Python imports
import os
import json
import time
import uuid
from typing import Dict
import logging

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Workspace,
    WorkspaceMember,
    Project,
    ProjectMember,
    IssueUserProperty,
    State,
    Label,
    Issue,
    IssueLabel,
    IssueSequence,
    IssueActivity,
)

logger = logging.getLogger("plane.worker")


def read_seed_file(filename):
    """
    Read a JSON file from the seed directory.

    Args:
        filename (str): Name of the JSON file to read

    Returns:
        dict: Contents of the JSON file
    """
    file_path = os.path.join(settings.SEED_DIR, "data", filename)
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        logger.error(f"Seed file {filename} not found in {settings.SEED_DIR}/data")
        return None
    except json.JSONDecodeError:
        logger.error(f"Error decoding JSON from {filename}")
        return None


def create_project_and_member(workspace: Workspace) -> Dict[int, uuid.UUID]:
    """Creates a project and associated members for a workspace.

    Creates a new project using the workspace name and sets up all necessary
    member associations and user properties.

    Args:
        workspace: The workspace to create the project in

    Returns:
        A mapping of seed project IDs to actual project IDs
    """
    project_seeds = read_seed_file("projects.json")
    project_identifier = "".join(ch for ch in workspace.name if ch.isalnum())[:5]

    # Create members
    workspace_members = WorkspaceMember.objects.filter(workspace=workspace).values(
        "member_id", "role"
    )

    projects_map: Dict[int, uuid.UUID] = {}

    if not project_seeds:
        logger.warning(
            "Task: workspace_seed_task -> No project seeds found. Skipping project creation."
        )
        return projects_map

    for project_seed in project_seeds:
        project_id = project_seed.pop("id")
        # Remove the name from seed data since we want to use workspace name
        project_seed.pop("name", None)
        project_seed.pop("identifier", None)

        project = Project.objects.create(
            **project_seed,
            workspace=workspace,
            name=workspace.name,  # Use workspace name
            identifier=project_identifier,
            created_by_id=workspace.created_by_id,
        )

        # Create project members
        ProjectMember.objects.bulk_create(
            [
                ProjectMember(
                    project=project,
                    member_id=workspace_member["member_id"],
                    role=workspace_member["role"],
                    workspace_id=workspace.id,
                    created_by_id=workspace.created_by_id,
                )
                for workspace_member in workspace_members
            ]
        )

        # Create issue user properties
        IssueUserProperty.objects.bulk_create(
            [
                IssueUserProperty(
                    project=project,
                    user_id=workspace_member["member_id"],
                    workspace_id=workspace.id,
                    display_filters={
                        "group_by": None,
                        "order_by": "sort_order",
                        "type": None,
                        "sub_issue": True,
                        "show_empty_groups": True,
                        "layout": "list",
                        "calendar_date_range": "",
                    },
                    created_by_id=workspace.created_by_id,
                )
                for workspace_member in workspace_members
            ]
        )
        # update map
        projects_map[project_id] = project.id
        logger.info(f"Task: workspace_seed_task -> Project {project_id} created")

    return projects_map


def create_project_states(
    workspace: Workspace, project_map: Dict[int, uuid.UUID]
) -> Dict[int, uuid.UUID]:
    """Creates states for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs

    Returns:
        A mapping of seed state IDs to actual state IDs
    """

    state_seeds = read_seed_file("states.json")
    state_map: Dict[int, uuid.UUID] = {}

    if not state_seeds:
        return state_map

    for state_seed in state_seeds:
        state_id = state_seed.pop("id")
        project_id = state_seed.pop("project_id")

        state = State.objects.create(
            **state_seed,
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=workspace.created_by_id,
        )

        state_map[state_id] = state.id
        logger.info(f"Task: workspace_seed_task -> State {state_id} created")
    return state_map


def create_project_labels(
    workspace: Workspace, project_map: Dict[int, uuid.UUID]
) -> Dict[int, uuid.UUID]:
    """Creates labels for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs

    Returns:
        A mapping of seed label IDs to actual label IDs
    """
    label_seeds = read_seed_file("labels.json")
    label_map: Dict[int, uuid.UUID] = {}

    if not label_seeds:
        return label_map

    for label_seed in label_seeds:
        label_id = label_seed.pop("id")
        project_id = label_seed.pop("project_id")
        label = Label.objects.create(
            **label_seed,
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=workspace.created_by_id,
        )
        label_map[label_id] = label.id

        logger.info(f"Task: workspace_seed_task -> Label {label_id} created")
    return label_map


def create_project_issues(
    workspace: Workspace,
    project_map: Dict[int, uuid.UUID],
    states_map: Dict[int, uuid.UUID],
    labels_map: Dict[int, uuid.UUID],
) -> None:
    """Creates issues and their associated records for each project.

    Creates issues along with their sequences, activities, and label associations.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs
        states_map: Mapping of seed state IDs to actual state IDs
        labels_map: Mapping of seed label IDs to actual label IDs
    """
    issue_seeds = read_seed_file("issues.json")

    if not issue_seeds:
        return

    for issue_seed in issue_seeds:
        required_fields = ["id", "labels", "project_id", "state_id"]
        # get the values
        for field in required_fields:
            if field not in issue_seed:
                logger.error(
                    f"Task: workspace_seed_task -> Required field '{field}' missing in issue seed"
                )
                continue

        # get the values
        issue_id = issue_seed.pop("id")
        labels = issue_seed.pop("labels")
        project_id = issue_seed.pop("project_id")
        state_id = issue_seed.pop("state_id")

        issue = Issue.objects.create(
            **issue_seed,
            state_id=states_map[state_id],
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=workspace.created_by_id,
        )
        IssueSequence.objects.create(
            issue=issue,
            project_id=project_map[project_id],
            workspace_id=workspace.id,
            created_by_id=workspace.created_by_id,
        )

        IssueActivity.objects.create(
            issue=issue,
            project_id=project_map[project_id],
            workspace_id=workspace.id,
            comment="created the issue",
            verb="created",
            actor_id=workspace.created_by_id,
            epoch=time.time(),
        )

        for label_id in labels:
            IssueLabel.objects.create(
                issue=issue,
                label_id=labels_map[label_id],
                project_id=project_map[project_id],
                workspace_id=workspace.id,
                created_by_id=workspace.created_by_id,
            )

        logger.info(f"Task: workspace_seed_task -> Issue {issue_id} created")
    return


@shared_task
def workspace_seed(workspace_id: uuid.UUID) -> None:
    """Seeds a new workspace with initial project data.

    Creates a complete workspace setup including:
    - Projects and project members
    - Project states
    - Project labels
    - Issues and their associations

    Args:
        workspace_id: ID of the workspace to seed
    """
    try:
        logger.info(f"Task: workspace_seed_task -> Seeding workspace {workspace_id}")
        # Get the workspace
        workspace = Workspace.objects.get(id=workspace_id)

        # Create a project with the same name as workspace
        project_map = create_project_and_member(workspace)

        # Create project states
        state_map = create_project_states(workspace, project_map)

        # Create project labels
        label_map = create_project_labels(workspace, project_map)

        # create project issues
        create_project_issues(workspace, project_map, state_map, label_map)

        logger.info(
            f"Task: workspace_seed_task -> Workspace {workspace_id} seeded successfully"
        )
        return
    except Exception as e:
        logger.error(
            f"Task: workspace_seed_task -> Failed to seed workspace {workspace_id}: {str(e)}"
        )
        raise e
