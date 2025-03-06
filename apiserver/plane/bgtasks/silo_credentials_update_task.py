# Django imports
from time import timezone
from plane.bgtasks.silo_data_migration_task import DatabaseMigration
from django.db import transaction
from django.utils import timezone


# Third party imports
from celery import shared_task


# Module imports
from plane.utils.exception_logger import log_exception
from plane.ee.models import (
    WorkspaceCredential,
)


class CredentialsUpdate(DatabaseMigration):
    def update_credentials(self):
        print("Updating credentials...")

        total_count = self._execute_with_error_handling(
            "SELECT COUNT(*) as count FROM silo.credentials"
        )[0]["count"]

        total_batches = (total_count + self.batch_size - 1) // self.batch_size
        records_processed = 0

        for batch_num in range(total_batches):
            offset = batch_num * self.batch_size
            current_batch = self._execute_with_error_handling(
                """
                SELECT * FROM silo.credentials 
                ORDER BY id
                LIMIT %s OFFSET %s
                """,
                (self.batch_size, offset),
            )

            try:
                with transaction.atomic():
                    # Get existing records that match the IDs in current batch
                    for cred in current_batch:
                        WorkspaceCredential.objects.filter(id=cred["id"]).update(
                            source_auth_email=cred["user_email"],
                            updated_at=timezone.now()
                        )

                    records_processed += len(current_batch)
                    print(
                        f"Processed credentials batch {batch_num + 1}/{total_batches} "
                        f"({records_processed}/{total_count} records)"
                    )
            except Exception as e:
                print(f"Error processing credentials batch {batch_num + 1}: {str(e)}")
                raise
    
    def migrate_all(self):
        try:
            print("Starting Credential Update process...")
            # Begin transaction at connection level
            self.conn.autocommit = False

            self.update_credentials()

            self.conn.commit()
            print("Credentials Update completed successfully!")

        except Exception as e:
            self.conn.rollback()
            print(f"Credentials Update failed, rolling back changes: {str(e)}")
            raise
        finally:
            self.conn.close()
            print("Database connection closed.")

    def __del__(self):
        try:
            if hasattr(self, "conn") and not self.conn.closed:
                self.conn.close()
        except Exception:
            pass


@shared_task
def schedule_silo_credentials_update_task(db_uri, batch_size):
    migration = CredentialsUpdate(db_uri, batch_size)
    migration.migrate_all()
    return "Migration completed successfully!"
