# Python imports
from logging import getLogger

# Django imports
from django.db import models, transaction

from plane.ee.models.workspace import WorkspaceEntityConnection

logger = getLogger("plane.silo.services.split_github_entity_connections")


GITHUB_ENTERPRISE = "GITHUB_ENTERPRISE"
GITHUB = "GITHUB"
PROJECT_ISSUE_SYNC = "PROJECT_ISSUE_SYNC"
PROJECT_PR_AUTOMATION = "PROJECT_PR_AUTOMATION"

ENTITY_TYPE_FOR_DUPLICATE_CHECK = [GITHUB_ENTERPRISE, GITHUB]


def split_github_entity_connections(
    workspace_entity_connection_model: models.Model,
    unsplit_entity_connection_ids: list[str] = [],
):
    """
    Split the GitHub entity connections into two: one for the project PR automation and one for the project issue sync.
    """

    logger.info("Splitting GitHub entity connections...")

    # Get the workspace entity connection model
    workspace_entity_connection_model = (
        workspace_entity_connection_model or WorkspaceEntityConnection
    )

    logger.info(
        f"Getting GitHub entity connections from {workspace_entity_connection_model.objects.count()} workspace entity connections..."
    )

    # Get the entity connections that have already been split
    entity_connections_ids_not_split, entity_connections_ids_already_split = (
        get_github_entity_connections_ids_split_and_not_split(
            workspace_entity_connection_model
        )
    )

    github_entity_connections = workspace_entity_connection_model.objects.filter(
        id__in=entity_connections_ids_not_split,
        deleted_at__isnull=True,
    )

    if len(unsplit_entity_connection_ids) > 0:
        logger.info(
            f"Using only the unsplit entity connections provided: {len(unsplit_entity_connection_ids)} for splitting..."
        )
        github_entity_connections = github_entity_connections.filter(
            id__in=unsplit_entity_connection_ids,
        )

    logger.info(
        f"Found {github_entity_connections.count()} GitHub entity connections for splitting..."
    )

    new_entity_connections = []
    with transaction.atomic():
        for ws_entity_connection in github_entity_connections:
            if ws_entity_connection.id in entity_connections_ids_already_split:
                logger.info(
                    f"Skipping {ws_entity_connection.id} because it has already been split..."
                )
                continue
            # Create the project issue sync entity connection
            project_issue_sync_entity_connection = workspace_entity_connection_model(
                workspace=ws_entity_connection.workspace,
                workspace_connection=ws_entity_connection.workspace_connection,
                project=ws_entity_connection.project,
                entity_type=ws_entity_connection.entity_type,
                entity_id=ws_entity_connection.entity_id,
                entity_slug=ws_entity_connection.entity_slug,
                entity_data=ws_entity_connection.entity_data,
                config={
                    "states": {"issueEventMapping": {}},
                    "allowBidirectionalSync": True,
                },
                type=PROJECT_ISSUE_SYNC,
            )
            new_entity_connections.append(project_issue_sync_entity_connection)

            # Create the project PR automation entity connection
            project_pr_automation_entity_connection = workspace_entity_connection_model(
                workspace=ws_entity_connection.workspace,
                workspace_connection=ws_entity_connection.workspace_connection,
                project=ws_entity_connection.project,
                entity_type=ws_entity_connection.entity_type,
                config={**ws_entity_connection.config, "allowBidirectionalSync": True},
                type=PROJECT_PR_AUTOMATION,
            )
            new_entity_connections.append(project_pr_automation_entity_connection)

            # Bulk create the entity connections in batches of 100
            if len(new_entity_connections) >= 100:
                workspace_entity_connection_model.objects.bulk_create(
                    new_entity_connections, batch_size=100
                )
                new_entity_connections = []

        # Create the remaining entity connections in a single batch
        if len(new_entity_connections) > 0:
            workspace_entity_connection_model.objects.bulk_create(
                new_entity_connections, batch_size=100
            )

    logger.info("GitHub entity connections split successfully...")

    return


def get_github_entity_connections_ids_split_and_not_split(
    workspace_entity_connection_model: models.Model,
):
    """
    Get the GitHub entity connections that have been split and not split
    """
    # get all duplicate check entity connections
    duplicate_check_entity_connections = (
        workspace_entity_connection_model.objects.filter(
            entity_type__in=ENTITY_TYPE_FOR_DUPLICATE_CHECK,
            deleted_at__isnull=True,
        )
    )

    # Get the entity connections that have been split
    split_entity_connections = duplicate_check_entity_connections.filter(
        type__in=[PROJECT_ISSUE_SYNC, PROJECT_PR_AUTOMATION],
    )

    # Get the type null entity connections
    type_null_entity_connections = duplicate_check_entity_connections.filter(
        type__isnull=True, deleted_at__isnull=True
    )

    entity_connections_ids_not_split = []
    entity_connections_ids_already_split = []
    # Check if the entity connection has not been split
    for entity_connection in type_null_entity_connections:
        # Check if the entity connection has not been split
        # same wsConnection and project but with a type null
        if not split_entity_connections.filter(
            workspace_connection=entity_connection.workspace_connection,
            project=entity_connection.project,
        ).exists():
            entity_connections_ids_not_split.append(entity_connection.id)
        else:
            entity_connections_ids_already_split.append(entity_connection.id)

    return entity_connections_ids_not_split, entity_connections_ids_already_split
