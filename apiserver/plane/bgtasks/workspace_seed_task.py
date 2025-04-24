# Python imports
import os
import json
import time

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
        print(f"Seed file {filename} not found in {settings.SEED_DIR}/data")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {filename}")
        return None


def create_project_and_member(workspace):
    project_seeds = read_seed_file("projects.json")
    project_identifier = "".join(ch for ch in workspace.name if ch.isalnum())[:5]

    # Create members
    workspace_members = WorkspaceMember.objects.filter(workspace=workspace).values(
        "member_id", "role"
    )

    projects = []
    projects_map = {}

    if not project_seeds:
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
                )
                for workspace_member in workspace_members
            ]
        )
        # update map
        projects_map[project_id] = project.id

        projects.append(project)

    return projects_map


def create_project_states(workspace, project_map):
    state_seeds = read_seed_file("states.json")
    state_map = {}

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

    return state_map


def create_project_labels(workspace, project_map):
    label_seeds = read_seed_file("labels.json")
    label_map = {}

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

    return label_map


def create_project_issues(workspace, project_map, states_map, labels_map):
    issue_seeds = read_seed_file("issues.json")

    if not issue_seeds:
        return

    for issue_seed in issue_seeds:
        _ = issue_seed.pop("id")
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

    return


@shared_task
def workspace_seed(workspace_id):
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

    return
