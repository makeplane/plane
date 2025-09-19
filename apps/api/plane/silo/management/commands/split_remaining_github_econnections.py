from django.core.management.base import BaseCommand

from plane.silo.services import (
    split_github_entity_connections,
    get_github_entity_connections_ids_split_and_not_split,
)
from plane.ee.models.workspace import WorkspaceEntityConnection


class Command(BaseCommand):
    help = "Split remaining GitHub entity connections"

    def add_arguments(self, parser):
        parser.add_argument(
            "--entity_connections_ids_not_split",
            type=str,
            help="Comma-separated list of entity connection IDs that have not been split",
            default="",
        )

    def handle(self, *args, **kwargs):
        """
        python manage.py split_remaining_github_econnections --entity_connections_ids_not_split=1,2,3
        """
        self.stdout.write("Splitting remaining GitHub entity connections")
        # get the entity connections that have not been split in args comma separated
        entity_connections_ids_not_split = (
            []
            if len(kwargs.get("entity_connections_ids_not_split", "")) == 0
            else kwargs.get("entity_connections_ids_not_split", "").split(",")
        )
        self.stdout.write(
            f"Entity connections that have not been split: {entity_connections_ids_not_split}"
        )
        split_github_entity_connections(
            WorkspaceEntityConnection, entity_connections_ids_not_split
        )
        self.stdout.write("Successfully split remaining GitHub entity connections")
