# wait_for_migrations.py
import time
from django.core.management.base import BaseCommand
from django.db.migrations.executor import MigrationExecutor
from django.db import connections, DEFAULT_DB_ALIAS


class Command(BaseCommand):
    help = "Wait for database migrations to complete before starting Celery worker/beat"

    def handle(self, *args, **kwargs):
        while self._pending_migrations():
            self.stdout.write("Waiting for database migrations to complete...")
            time.sleep(10)  # wait for 10 seconds before checking again

        self.stdout.write(self.style.SUCCESS("No migrations Pending. Starting processes ..."))

    def _pending_migrations(self):
        connection = connections[DEFAULT_DB_ALIAS]
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        return bool(executor.migration_plan(targets))
