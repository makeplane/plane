# Python imports
import uuid

# Django imports
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db.migrations.executor import MigrationExecutor
from django.db import connections, DEFAULT_DB_ALIAS

# Module imports
from plane.settings.redis import redis_instance


class Command(BaseCommand):
    help = 'Run migrations with Redis distributed locking if there are pending migrations'

    def handle(self, *args, **kwargs):
        # Check for pending migrations
        if not self._pending_migrations():
            self.stdout.write("No pending migrations.")
            return

        # Proceed with acquiring the lock and running migrations
        lock_key = 'django_migration_lock'
        lock_value = str(uuid.uuid4())  # Unique value for the lock
        client = redis_instance()

        # Try acquiring the lock
        if client.set(lock_key, lock_value, nx=True, ex=300):  # 5 minutes expiry
            try:
                self.stdout.write("Acquired migration lock, running migrations...")
                call_command('migrate')
            finally:
                # Release the lock if it belongs to this process
                stored_value = client.get(lock_key)
                if stored_value and stored_value.decode() == lock_value:
                    client.delete(lock_key)
                    self.stdout.write("Released migration lock.")
                else:
                    self.stdout.write("Lock was not released, as it was held by another instance.")
        else:
            self.stdout.write("Migration lock is held by another instance.")

    def _pending_migrations(self):
        connection = connections[DEFAULT_DB_ALIAS]
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        return bool(executor.migration_plan(targets))
