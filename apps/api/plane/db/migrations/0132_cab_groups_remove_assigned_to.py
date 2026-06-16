"""
Migration 0132: CAB Groups + Remove assigned_to + Voided status

1. Creates CabGroup and CabGroupMember models
2. Adds cab_group FK to WorkspaceSecOpsConfig
3. Removes assigned_to from ChangeRequest and ChangeTask
4. Adds "voided" to APPROVAL_STATUS_CHOICES (no schema change needed
   since it's a CharField choices update — Django doesn't enforce
   choices at the DB level, but we update the field for documentation)
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0131_assignmentgroup_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ------------------------------------------------------------------
        # 1. Create CabGroup
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="CabGroup",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cab_groups", to="db.workspace")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
            ],
            options={
                "db_table": "cab_groups",
                "ordering": ("name",),
                "unique_together": {("workspace", "name")},
            },
        ),

        # ------------------------------------------------------------------
        # 2. Create CabGroupMember
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="CabGroupMember",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("cab_group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="group_members", to="db.cabgroup")),
                ("member", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cab_group_memberships", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
            ],
            options={
                "db_table": "cab_group_members",
                "unique_together": {("cab_group", "member")},
            },
        ),

        # ------------------------------------------------------------------
        # 3. Add ManyToManyField on CabGroup (through CabGroupMember)
        # ------------------------------------------------------------------
        migrations.AddField(
            model_name="cabgroup",
            name="members",
            field=models.ManyToManyField(
                related_name="cab_groups",
                through="db.CabGroupMember",
                through_fields=("cab_group", "member"),
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # ------------------------------------------------------------------
        # 4. Add cab_group FK to WorkspaceSecOpsConfig
        # ------------------------------------------------------------------
        migrations.AddField(
            model_name="workspacesecopsconfig",
            name="cab_group",
            field=models.ForeignKey(
                blank=True,
                help_text="The designated CAB group for this workspace. Used during the Authorize stage of Normal changes.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="secops_configs",
                to="db.cabgroup",
            ),
        ),

        # ------------------------------------------------------------------
        # 5. Remove assigned_to from ChangeRequest
        # ------------------------------------------------------------------
        migrations.RemoveField(
            model_name="changerequest",
            name="assigned_to",
        ),

        # ------------------------------------------------------------------
        # 6. Remove assigned_to from ChangeTask
        # ------------------------------------------------------------------
        migrations.RemoveField(
            model_name="changetask",
            name="assigned_to",
        ),

        # ------------------------------------------------------------------
        # 7. Update approval status choices to include "voided"
        #    (CharField choices are not enforced at DB level, but this
        #    documents the migration intent)
        # ------------------------------------------------------------------
        migrations.AlterField(
            model_name="changeapproval",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                    ("voided", "Voided"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
