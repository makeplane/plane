from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0125_workspaceuserproperties_navigation_sprint_preference"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="workspacesprintautomation",
            name="access",
            field=models.PositiveSmallIntegerField(choices=[(0, "Private"), (2, "Public")], default=2),
        ),
        migrations.CreateModel(
            name="WorkspaceSprintAutomationMember",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(db_index=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                (
                    "automation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_members",
                        to="db.workspacesprintautomation",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="workspacesprintautomationmember_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "member",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_sprint_automation_members",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_workspacesprintautomationmember",
                        to="db.project",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="workspacesprintautomationmember_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_workspacesprintautomationmember",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Workspace Sprint Automation Member",
                "verbose_name_plural": "Workspace Sprint Automation Members",
                "db_table": "workspace_sprint_automation_members",
                "ordering": ("-created_at",),
                "unique_together": {("automation", "member", "deleted_at")},
            },
        ),
        migrations.AddConstraint(
            model_name="workspacesprintautomationmember",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("automation", "member"),
                name="workspace_sprint_automation_member_unique_when_deleted_at_null",
            ),
        ),
    ]
