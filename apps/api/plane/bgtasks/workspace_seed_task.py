# Python imports
import os
import json
import time
import uuid
from typing import Dict
import logging
from datetime import timedelta

# Django imports
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.hashers import make_password

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Workspace,
    WorkspaceMember,
    Project,
    ProjectMember,
    ProjectUserProperty,
    State,
    Label,
    Issue,
    IssueLabel,
    IssueSequence,
    IssueActivity,
    Page,
    ProjectPage,
    Cycle,
    Module,
    CycleIssue,
    ModuleIssue,
    IssueView,
    User,
    BotTypeEnum,
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


def create_project_and_member(workspace: Workspace, bot_user: User) -> Dict[int, uuid.UUID]:
    """Creates a project and associated members for a workspace.

    Creates a new project using the workspace name and sets up all necessary
    member associations and user properties.

    Args:
        workspace: The workspace to create the project in
        bot_user: The bot user to use for creating the project
    Returns:
        A mapping of seed project IDs to actual project IDs
    """
    project_seeds = read_seed_file("projects.json")
    project_identifier = "".join(ch for ch in workspace.name if ch.isalnum())[:5]

    # Create members
    workspace_members = WorkspaceMember.objects.filter(workspace=workspace).values("member_id", "role")

    projects_map: Dict[int, uuid.UUID] = {}

    if not project_seeds:
        logger.warning("Task: workspace_seed_task -> No project seeds found. Skipping project creation.")
        return projects_map

    for project_seed in project_seeds:
        project_id = project_seed.pop("id")
        # Remove the name from seed data since we want to use workspace name
        project_seed.pop("name", None)
        project_seed.pop("identifier", None)

        project = Project(
            **project_seed,
            workspace=workspace,
            name=workspace.name,  # Use workspace name
            identifier=project_identifier,
            created_by_id=bot_user.id,
            # Enable all views in seed data
            cycle_view=True,
            module_view=True,
            issue_views_view=True,
        )
        project.save(created_by_id=bot_user.id, disable_auto_set_user=True)

        # Create project members
        ProjectMember.objects.bulk_create(
            [
                ProjectMember(
                    project=project,
                    member_id=workspace_member["member_id"],
                    role=workspace_member["role"],
                    workspace_id=workspace.id,
                    created_by_id=bot_user.id,
                )
                for workspace_member in workspace_members
            ]
        )

        # Create issue user properties
        ProjectUserProperty.objects.bulk_create(
            [
                ProjectUserProperty(
                    project=project,
                    user_id=workspace_member["member_id"],
                    workspace_id=workspace.id,
                    display_filters={
                        "layout": "list",
                        "calendar": {"layout": "month", "show_weekends": False},
                        "group_by": "state",
                        "order_by": "sort_order",
                        "sub_issue": True,
                        "sub_group_by": None,
                        "show_empty_groups": True,
                    },
                    display_properties={
                        "key": True,
                        "link": True,
                        "cycle": False,
                        "state": True,
                        "labels": False,
                        "modules": False,
                        "assignee": True,
                        "due_date": False,
                        "estimate": True,
                        "priority": True,
                        "created_on": True,
                        "issue_type": True,
                        "start_date": False,
                        "updated_on": True,
                        "customer_count": True,
                        "sub_issue_count": False,
                        "attachment_count": False,
                        "customer_request_count": True,
                    },
                    created_by_id=bot_user.id,
                )
                for workspace_member in workspace_members
            ]
        )
        # update map
        projects_map[project_id] = project.id
        logger.info(f"Task: workspace_seed_task -> Project {project_id} created")

    return projects_map


def create_project_states(
    workspace: Workspace, project_map: Dict[int, uuid.UUID], bot_user: User
) -> Dict[int, uuid.UUID]:
    """Creates states for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs
        bot_user: The bot user to use for creating the states
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

        state = State(
            **state_seed,
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=bot_user.id,
        )
        state.save(created_by_id=bot_user.id, disable_auto_set_user=True)
        state_map[state_id] = state.id
        logger.info(f"Task: workspace_seed_task -> State {state_id} created")
    return state_map


def create_project_labels(
    workspace: Workspace, project_map: Dict[int, uuid.UUID], bot_user: User
) -> Dict[int, uuid.UUID]:
    """Creates labels for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs
        bot_user: The bot user to use for creating the labels
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
        label = Label(
            **label_seed,
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=bot_user.id,
        )
        label.save(created_by_id=bot_user.id, disable_auto_set_user=True)
        label_map[label_id] = label.id

        logger.info(f"Task: workspace_seed_task -> Label {label_id} created")
    return label_map


def create_project_issues(
    workspace: Workspace,
    project_map: Dict[int, uuid.UUID],
    states_map: Dict[int, uuid.UUID],
    labels_map: Dict[int, uuid.UUID],
    cycles_map: Dict[int, uuid.UUID],
    module_map: Dict[int, uuid.UUID],
    bot_user: User,
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
                logger.error(f"Task: workspace_seed_task -> Required field '{field}' missing in issue seed")
                continue

        # get the values
        issue_id = issue_seed.pop("id")
        labels = issue_seed.pop("labels")
        project_id = issue_seed.pop("project_id")
        state_id = issue_seed.pop("state_id")
        cycle_id = issue_seed.pop("cycle_id")
        module_ids = issue_seed.pop("module_ids")

        issue = Issue(
            **issue_seed,
            state_id=states_map[state_id],
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=bot_user.id,
        )
        issue.save(created_by_id=bot_user.id, disable_auto_set_user=True)
        IssueSequence.objects.create(
            issue=issue,
            project_id=project_map[project_id],
            workspace_id=workspace.id,
            created_by_id=bot_user.id,
        )

        IssueActivity.objects.create(
            issue=issue,
            project_id=project_map[project_id],
            workspace_id=workspace.id,
            comment="created the issue",
            verb="created",
            actor_id=bot_user.id,
            epoch=time.time(),
        )

        # Create issue labels
        for label_id in labels:
            IssueLabel.objects.create(
                issue=issue,
                label_id=labels_map[label_id],
                project_id=project_map[project_id],
                workspace_id=workspace.id,
                created_by_id=bot_user.id,
            )

        # Create cycle issues
        if cycle_id:
            CycleIssue.objects.create(
                issue=issue,
                cycle_id=cycles_map[cycle_id],
                project_id=project_map[project_id],
                workspace_id=workspace.id,
                created_by_id=bot_user.id,
            )

        # Create module issues
        if module_ids:
            for module_id in module_ids:
                ModuleIssue.objects.create(
                    issue=issue,
                    module_id=module_map[module_id],
                    project_id=project_map[project_id],
                    workspace_id=workspace.id,
                    created_by_id=bot_user.id,
                )

        logger.info(f"Task: workspace_seed_task -> Issue {issue_id} created")
    return


def create_pages(workspace: Workspace, project_map: Dict[int, uuid.UUID], bot_user: User) -> None:
    """Creates pages for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs
        bot_user: The bot user to use for creating the pages
    """
    page_seeds = read_seed_file("pages.json")

    if not page_seeds:
        return

    for page_seed in page_seeds:
        page_id = page_seed.pop("id")

        page = Page(
            workspace_id=workspace.id,
            is_global=False,
            access=page_seed.get("access", Page.PUBLIC_ACCESS),
            name=page_seed.get("name"),
            description_json=page_seed.get("description_json", {}),
            description_html=page_seed.get("description_html", "<p></p>"),
            description_binary=page_seed.get("description_binary", None),
            description_stripped=page_seed.get("description_stripped", None),
            created_by_id=bot_user.id,
            updated_by_id=bot_user.id,
            owned_by_id=bot_user.id,
        )

        page.save(created_by_id=bot_user.id, disable_auto_set_user=True)

        logger.info(f"Task: workspace_seed_task -> Page {page_id} created")
        if page_seed.get("project_id") and page_seed.get("type") == "PROJECT":
            project_page = ProjectPage(
                workspace_id=workspace.id,
                project_id=project_map[page_seed.get("project_id")],
                page_id=page.id,
                created_by_id=bot_user.id,
                updated_by_id=bot_user.id,
            )
            project_page.save(created_by_id=bot_user.id, disable_auto_set_user=True)
            logger.info(f"Task: workspace_seed_task -> Project Page {page_id} created")
    return


def create_cycles(workspace: Workspace, project_map: Dict[int, uuid.UUID], bot_user: User) -> Dict[int, uuid.UUID]:
    """Creates cycles for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs
        bot_user: The bot user to use for creating the cycles
    Returns:
        A mapping of seed cycle IDs to actual cycle IDs
    """
    cycle_seeds = read_seed_file("cycles.json")
    if not cycle_seeds:
        return {}

    cycle_map: Dict[int, uuid.UUID] = {}

    for cycle_seed in cycle_seeds:
        cycle_id = cycle_seed.pop("id")
        project_id = cycle_seed.pop("project_id")
        type = cycle_seed.pop("type")

        if type == "CURRENT":
            start_date = timezone.now()
            end_date = start_date + timedelta(days=14)

        if type == "UPCOMING":
            # Get the last cycle
            last_cycle = Cycle.objects.filter(project_id=project_map[project_id]).order_by("-end_date").first()
            if last_cycle:
                start_date = last_cycle.end_date + timedelta(days=1)
                end_date = start_date + timedelta(days=14)
            else:
                start_date = timezone.now() + timedelta(days=14)
                end_date = start_date + timedelta(days=14)

        cycle = Cycle(
            **cycle_seed,
            start_date=start_date,
            end_date=end_date,
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=bot_user.id,
            owned_by_id=bot_user.id,
        )
        cycle.save(created_by_id=bot_user.id, disable_auto_set_user=True)

        cycle_map[cycle_id] = cycle.id
        logger.info(f"Task: workspace_seed_task -> Cycle {cycle_id} created")
    return cycle_map


def create_modules(workspace: Workspace, project_map: Dict[int, uuid.UUID], bot_user: User) -> None:
    """Creates modules for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs
        bot_user: The bot user to use for creating the modules
    """
    module_seeds = read_seed_file("modules.json")
    if not module_seeds:
        return {}

    module_map: Dict[int, uuid.UUID] = {}

    for index, module_seed in enumerate(module_seeds):
        module_id = module_seed.pop("id")
        project_id = module_seed.pop("project_id")

        start_date = timezone.now() + timedelta(days=index * 2)
        end_date = start_date + timedelta(days=14)

        module = Module(
            **module_seed,
            start_date=start_date,
            target_date=end_date,
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=bot_user.id,
        )
        module.save(created_by_id=bot_user.id, disable_auto_set_user=True)
        module_map[module_id] = module.id
        logger.info(f"Task: workspace_seed_task -> Module {module_id} created")
    return module_map


def create_views(workspace: Workspace, project_map: Dict[int, uuid.UUID], bot_user: User) -> None:
    """Creates views for each project in the workspace.

    Args:
        workspace: The workspace containing the projects
        project_map: Mapping of seed project IDs to actual project IDs
        bot_user: The bot user to use for creating the views
    """

    view_seeds = read_seed_file("views.json")
    if not view_seeds:
        return

    for view_seed in view_seeds:
        project_id = view_seed.pop("project_id")
        view_seed.pop("id")
        issue_view = IssueView(
            **view_seed,
            project_id=project_map[project_id],
            workspace=workspace,
            created_by_id=bot_user.id,
            owned_by_id=bot_user.id,
        )
        issue_view.save(created_by_id=bot_user.id, disable_auto_set_user=True)


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

        # Create a bot user for creating all the workspace data
        bot_user = User.objects.create(
            username=f"bot_user_{workspace.id}",
            display_name="Plane",
            first_name="Plane",
            last_name="",
            is_bot=True,
            bot_type=BotTypeEnum.WORKSPACE_SEED,
            email=f"bot_user_{workspace.id}@plane.so",
            password=make_password(uuid.uuid4().hex),
            is_password_autoset=True,
        )

        # Add bot user to workspace as member
        WorkspaceMember.objects.create(
            workspace=workspace,
            member=bot_user,
            role=20,
            company_role="",
        )

        # Create a project with the same name as workspace
        project_map = create_project_and_member(workspace, bot_user)

        # Create project states
        state_map = create_project_states(workspace, project_map, bot_user)

        # Create project labels
        label_map = create_project_labels(workspace, project_map, bot_user)

        # Create project cycles
        cycle_map = create_cycles(workspace, project_map, bot_user)

        # Create project modules
        module_map = create_modules(workspace, project_map, bot_user)

        # create project issues
        create_project_issues(workspace, project_map, state_map, label_map, cycle_map, module_map, bot_user)

        # create project views
        create_views(workspace, project_map, bot_user)

        # create project pages
        create_pages(workspace, project_map, bot_user)

        logger.info(f"Task: workspace_seed_task -> Workspace {workspace_id} seeded successfully")
        return
    except Exception as e:
        logger.error(f"Task: workspace_seed_task -> Failed to seed workspace {workspace_id}: {str(e)}")
        raise e
