"""
Migration 0133: ChangeTask enhancements for ServiceNow alignment.

Uses atomic=False to avoid PostgreSQL conflict between FK trigger events
and index creation in the same transaction.
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_task_data_forward(apps, schema_editor):
    """Rename old task_type and state values to new ServiceNow-aligned values."""
    ChangeTask = apps.get_model("db", "ChangeTask")

    # task_type renames
    ChangeTask.objects.filter(task_type="implement").update(task_type="implementation")
    ChangeTask.objects.filter(task_type="post_implementation_review").update(task_type="testing")

    # state renames
    ChangeTask.objects.filter(state="open").update(state="pending")
    ChangeTask.objects.filter(state="closed").update(state="closed_complete")
    ChangeTask.objects.filter(state="cancelled").update(state="closed_skipped")


def migrate_task_data_backward(apps, schema_editor):
    """Reverse the renames."""
    ChangeTask = apps.get_model("db", "ChangeTask")

    ChangeTask.objects.filter(task_type="implementation").update(task_type="implement")
    ChangeTask.objects.filter(task_type="testing").update(task_type="post_implementation_review")

    ChangeTask.objects.filter(state="pending").update(state="open")
    ChangeTask.objects.filter(state="closed_complete").update(state="closed")
    ChangeTask.objects.filter(state="closed_skipped").update(state="cancelled")


class Migration(migrations.Migration):
    # Run each operation in its own transaction to avoid
    # "pending trigger events" conflict in PostgreSQL
    atomic = False

    dependencies = [
        ("db", "0132_cab_groups_remove_assigned_to"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Add short_description
        migrations.AddField(
            model_name="changetask",
            name="short_description",
            field=models.CharField(default="", max_length=255, verbose_name="Short Description"),
        ),

        # 2. Add due_date
        migrations.AddField(
            model_name="changetask",
            name="due_date",
            field=models.DateTimeField(blank=True, null=True),
        ),

        # 3. Add order
        migrations.AddField(
            model_name="changetask",
            name="order",
            field=models.PositiveIntegerField(default=0),
        ),

        # 4. Update task_type choices
        migrations.AlterField(
            model_name="changetask",
            name="task_type",
            field=models.CharField(
                choices=[
                    ("implementation", "Implementation"),
                    ("testing", "Testing"),
                    ("review", "Review"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=40,
            ),
        ),

        # 5. Update state choices
        migrations.AlterField(
            model_name="changetask",
            name="state",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("in_progress", "In Progress"),
                    ("closed_complete", "Closed Complete"),
                    ("closed_incomplete", "Closed Incomplete"),
                    ("closed_skipped", "Closed Skipped"),
                ],
                default="pending",
                max_length=20,
            ),
        ),

        # 6. Update ordering
        migrations.AlterModelOptions(
            name="changetask",
            options={
                "ordering": ("order", "created_at"),
                "verbose_name": "Change Task",
                "verbose_name_plural": "Change Tasks",
            },
        ),

        # 7. Add assignment_group FK (after index changes)
        migrations.AddField(
            model_name="changetask",
            name="assignment_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="change_tasks",
                to="db.assignmentgroup",
            ),
        ),

        # 8. Data migration — after all schema changes
        migrations.RunPython(
            migrate_task_data_forward,
            migrate_task_data_backward,
        ),
    ]
