from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0138_workspace_board_of_director"),
    ]

    operations = [
        # Make code field optional (blank allowed, default empty string)
        migrations.AlterField(
            model_name="department",
            name="code",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        # Drop old unique constraint (enforced on all non-deleted rows)
        migrations.RemoveConstraint(
            model_name="department",
            name="department_unique_code",
        ),
        # Re-add unique constraint only for non-empty codes
        migrations.AddConstraint(
            model_name="department",
            constraint=models.UniqueConstraint(
                fields=["code"],
                condition=models.Q(deleted_at__isnull=True, code__gt=""),
                name="department_unique_code",
            ),
        ),
    ]
