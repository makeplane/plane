from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0160_fix_task_category_display_true"),
    ]

    operations = [
        migrations.CreateModel(
            name="DepartmentTaskCategory",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(null=True, blank=True)),
                (
                    "department",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="task_category_links",
                        to="db.department",
                    ),
                ),
                (
                    "main_task_category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="department_links",
                        to="db.maintaskcategory",
                    ),
                ),
            ],
            options={
                "db_table": "department_task_categories",
                "unique_together": {("department", "main_task_category")},
            },
        ),
        migrations.AddField(
            model_name="maintaskcategory",
            name="departments",
            field=models.ManyToManyField(
                blank=True,
                related_name="main_task_categories",
                through="db.DepartmentTaskCategory",
                to="db.department",
            ),
        ),
    ]
