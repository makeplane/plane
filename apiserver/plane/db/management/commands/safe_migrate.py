# Python imports
import time
import uuid
import atexit

# Django imports
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db.migrations.executor import MigrationExecutor
from django.db import connections, DEFAULT_DB_ALIAS


class Command(BaseCommand):
    help = 'Wait for migrations to be completed and acquire lock before starting migrations'

    def handle(self, *args, **kwargs):
        self.lock_key = 'django_migration_lock'
        self.lock_value = str(uuid.uuid4())  # Unique value for the lock
        self.client = redis_instance()

        # Register the cleanup function
        atexit.register(self.cleanup)

        while self._pending_migrations():
            # Try acquiring the lock
            if self.client.set(self.lock_key, self.lock_value, nx=True, ex=300):  # 5 minutes expiry
                try:
                    self.stdout.write("Acquired migration lock, running migrations...")
                    call_command('migrate')
                except Exception as e:
                    self.stdout.write(f"An error occurred during migrations: {e}")
                finally:
                    # Release the lock if it belongs to this process
                    self.cleanup()
                return  # Exit after attempting migration
            else:
                self.stdout.write("Migration lock is held by another instance. Waiting 10 seconds to retry...")
                time.sleep(10)  # Wait for 10 seconds before retrying

        self.stdout.write("No pending migrations.")

    def _pending_migrations(self):
        connection = connections[DEFAULT_DB_ALIAS]
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        return bool(executor.migration_plan(targets))

    def cleanup(self):
        """
        Clean up function to release the lock.
        """
        stored_value = self.client.get(self.lock_key)
        if stored_value and stored_value.decode() == self.lock_value:
            self.client.delete(self.lock_key)
            self.stdout.write("Released migration lock.")