# Django imports
from django.db import transaction


# Third party imports
from celery import shared_task
import psycopg
from psycopg.rows import dict_row
import uuid
from datetime import datetime

# Module imports
from plane.utils.exception_logger import log_exception
from plane.ee.models import (
    WorkspaceCredential,
    WorkspaceConnection,
    WorkspaceEntityConnection,
    ImportJob,
    ImportReport,
)


class DatabaseMigration:
    def __init__(self, db_uri, batch_size=10):
        # psycopg3 uses conninfo string instead of dsn
        self.conn = psycopg.connect(conninfo=db_uri)
        # Use dict_row as row_factory instead of RealDictCursor
        self.conn.row_factory = dict_row
        self.batch_size = batch_size

    def _execute_with_error_handling(self, query, params=None):
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, params)
                return cur.fetchall() if cur.description else None
        except psycopg.Error as e:
            log_exception(e)
            raise

    def migrate_credentials(self):
        print("Migrating credentials...")

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
                    credentials = [
                        WorkspaceCredential(
                            id=cred["id"],
                            source=cred["source"],
                            workspace_id=cred["workspace_id"],
                            user_id=cred["user_id"],
                            source_access_token=cred["source_access_token"],
                            source_refresh_token=cred["source_refresh_token"],
                            source_hostname=cred["source_hostname"],
                            target_access_token=cred["target_access_token"],
                            is_pat=cred["is_pat"],
                            is_active=cred["is_active"],
                            created_at=datetime.now(),
                            updated_at=datetime.now(),
                        )
                        for cred in current_batch
                    ]
                    WorkspaceCredential.objects.bulk_create(
                        credentials, ignore_conflicts=True
                    )

                records_processed += len(current_batch)
                print(
                    f"Processed credentials batch {batch_num + 1}/{total_batches} "
                    f"({records_processed}/{total_count} records)"
                )

            except Exception as e:
                print(f"Error processing credentials batch {batch_num + 1}: {str(e)}")
                raise

    def migrate_workspace_connections(self):
        print("Migrating workspace connections...")

        total_count = self._execute_with_error_handling(
            "SELECT COUNT(*) as count FROM silo.workspace_connections"
        )[0]["count"]

        total_batches = (total_count + self.batch_size - 1) // self.batch_size
        records_processed = 0

        for batch_num in range(total_batches):
            offset = batch_num * self.batch_size
            current_batch = self._execute_with_error_handling(
                """
                SELECT * FROM silo.workspace_connections 
                ORDER BY id
                LIMIT %s OFFSET %s
                """,
                (self.batch_size, offset),
            )

            try:
                with transaction.atomic():
                    connections = [
                        WorkspaceConnection(
                            id=conn["id"],
                            workspace_id=conn["workspace_id"],
                            credential_id=conn["credentials_id"],
                            target_hostname=conn["target_hostname"],
                            source_hostname=conn["source_hostname"],
                            connection_type=conn["connection_type"],
                            connection_id=conn["connection_id"],
                            connection_data=conn["connection_data"],
                            connection_slug=conn["connection_slug"],
                            config=conn["config"],
                            scopes=[],
                            created_at=conn["created_at"],
                            updated_at=conn["updated_at"],
                        )
                        for conn in current_batch
                    ]
                    WorkspaceConnection.objects.bulk_create(
                        connections, ignore_conflicts=True
                    )

                records_processed += len(current_batch)
                print(
                    f"Processed connections batch {batch_num + 1}/{total_batches} "
                    f"({records_processed}/{total_count} records)"
                )

            except Exception as e:
                print(f"Error processing connections batch {batch_num + 1}: {str(e)}")
                raise

    def migrate_entity_connections(self):
        print("Migrating entity connections...")

        total_count = self._execute_with_error_handling(
            "SELECT COUNT(*) as count FROM silo.entity_connections"
        )[0]["count"]

        total_batches = (total_count + self.batch_size - 1) // self.batch_size
        records_processed = 0

        for batch_num in range(total_batches):
            offset = batch_num * self.batch_size
            current_batch = self._execute_with_error_handling(
                """
                SELECT * FROM silo.entity_connections 
                ORDER BY id
                LIMIT %s OFFSET %s
                """,
                (self.batch_size, offset),
            )

            try:
                with transaction.atomic():
                    entities = [
                        WorkspaceEntityConnection(
                            id=entity["id"],
                            workspace_id=entity["workspace_id"],
                            project_id=entity["project_id"],
                            workspace_connection_id=entity["workspace_connection_id"],
                            type=entity["connection_type"],
                            entity_type=(
                                entity["entity_data"]["type"]
                                if "type" in entity["entity_data"]
                                else None
                            ),
                            entity_id=entity["entity_id"],
                            entity_slug=entity["entity_slug"],
                            entity_data=entity["entity_data"],
                            config=entity["config"],
                            created_at=entity["created_at"],
                            updated_at=entity["updated_at"],
                        )
                        for entity in current_batch
                    ]
                    WorkspaceEntityConnection.objects.bulk_create(
                        entities, ignore_conflicts=True
                    )

                records_processed += len(current_batch)
                print(
                    f"Processed entities batch {batch_num + 1}/{total_batches} "
                    f"({records_processed}/{total_count} records)"
                )

            except Exception as e:
                print(f"Error processing entities batch {batch_num + 1}: {str(e)}")
                raise

    def migrate_jobs(self):
        print("Migrating jobs...")

        total_count = self._execute_with_error_handling(
            "SELECT COUNT(*) as count FROM silo.job_configs"
        )[0]["count"]

        report_ids = []
        total_batches = (total_count + self.batch_size - 1) // self.batch_size
        records_processed = 0

        # Create reports in batches
        for batch_num in range(total_batches):
            offset = batch_num * self.batch_size
            current_batch = self._execute_with_error_handling(
                """
                SELECT * FROM silo.job_configs 
                ORDER BY id
                LIMIT %s OFFSET %s
                """,
                (self.batch_size, offset),
            )

            try:
                with transaction.atomic():
                    reports = []
                    for _ in current_batch:
                        report_id = str(uuid.uuid4())
                        report_ids.append(report_id)
                        reports.append(
                            ImportReport(
                                id=report_id,
                                created_at=datetime.now(),
                                updated_at=datetime.now(),
                                batch_size=0,
                                total_batch_count=0,
                                imported_batch_count=0,
                                errored_batch_count=0,
                                total_issue_count=0,
                                imported_issue_count=0,
                                errored_issue_count=0,
                                total_page_count=0,
                                imported_page_count=0,
                                errored_page_count=0,
                            )
                        )
                    ImportReport.objects.bulk_create(reports, ignore_conflicts=True)

                records_processed += len(current_batch)
                print(
                    f"Processed reports batch {batch_num + 1}/{total_batches} "
                    f"({records_processed}/{total_count} records)"
                )

            except Exception as e:
                print(f"Error processing reports batch {batch_num + 1}: {str(e)}")
                raise

        records_processed = 0
        for batch_num in range(total_batches):
            offset = batch_num * self.batch_size
            current_batch = self._execute_with_error_handling(
                """
                SELECT j.*, jc.meta as config_meta 
                FROM silo.jobs j
                LEFT JOIN silo.job_configs jc ON j.config_id = jc.id
                ORDER BY j.id
                LIMIT %s OFFSET %s
                """,
                (self.batch_size, offset),
            )

            try:
                with transaction.atomic():
                    jobs = [
                        ImportJob(
                            id=job["id"],
                            source=job["migration_type"],
                            config=job["config_meta"],
                            project_id=job["project_id"],
                            workspace_id=job["workspace_id"],
                            initiator_id=job["initiator_id"],
                            report_id=(
                                report_ids[i]
                                if i < len(report_ids)
                                else str(uuid.uuid4())
                            ),
                            status=job["status"],
                            created_at=job["created_at"],
                            updated_at=job["updated_at"],
                            with_issue_types=False,
                            success_metadata={},
                            error_metadata={},
                        )
                        for i, job in enumerate(current_batch)
                    ]
                    ImportJob.objects.bulk_create(jobs, ignore_conflicts=True)

                records_processed += len(current_batch)
                print(
                    f"Processed jobs batch {batch_num + 1}/{total_batches} "
                    f"({records_processed}/{total_count} records)"
                )

            except Exception as e:
                print(f"Error processing jobs batch {batch_num + 1}: {str(e)}")
                raise

    def migrate_all(self):
        try:
            print("Starting migration process...")
            # Begin transaction at connection level
            self.conn.autocommit = False

            self.migrate_credentials()
            self.migrate_workspace_connections()
            self.migrate_entity_connections()
            self.migrate_jobs()

            self.conn.commit()
            print("Migration completed successfully!")

        except Exception as e:
            self.conn.rollback()
            print(f"Migration failed, rolling back changes: {str(e)}")
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
def schedule_silo_data_migration_task(db_uri, batch_size):
    migration = DatabaseMigration(db_uri, batch_size)
    migration.migrate_all()
    return "Migration completed successfully!"
