from django.core.management.base import BaseCommand
from plane.bgtasks.silo_data_migration_task import schedule_silo_data_migration_task


class Command(BaseCommand):
    help = "Migrate data from old schema to new schema using Django models"

    def handle(self, *args, **options):
        db_uri = input("Enter database uri: ")
        batch_size = int(input("Enter the batch size: "))

        try:
            schedule_silo_data_migration_task.delay(db_uri, batch_size)
        except Exception as e:
            print(f"Migration failed: {str(e)}")
            raise
