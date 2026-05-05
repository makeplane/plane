"""
Phase 1: Department-Workspace Model Migration
- Remove workspace FK from Department and StaffProfile
- Remove linked_project FK from Department
- Add linked_workspace OneToOneField (nullable) to Department
- Update unique constraints to instance-level (global uniqueness)
"""

import django.db.models.deletion
from django.db import migrations, models


def check_duplicates(apps, schema_editor):
    """Abort migration if duplicate codes exist that would violate new global unique constraints."""
    Department = apps.get_model("db", "Department")
    StaffProfile = apps.get_model("db", "StaffProfile")

    conflicts = []

    # Check Department global duplicates
    for field in ("code", "short_name", "dept_code"):
        from django.db.models import Count

        dupes = (
            Department.objects.filter(deleted_at__isnull=True)
            .values(field)
            .annotate(cnt=Count("id"))
            .filter(cnt__gt=1)
        )
        if dupes.exists():
            for row in dupes:
                conflicts.append(
                    f"Department.{field}='{row[field]}' appears {row['cnt']} times"
                )

    # Check StaffProfile global duplicates
    for field in ("staff_id",):
        from django.db.models import Count

        dupes = (
            StaffProfile.objects.filter(deleted_at__isnull=True)
            .values(field)
            .annotate(cnt=Count("id"))
            .filter(cnt__gt=1)
        )
        if dupes.exists():
            for row in dupes:
                conflicts.append(
                    f"StaffProfile.{field}='{row[field]}' appears {row['cnt']} times"
                )

    # Check StaffProfile user duplicates
    from django.db.models import Count as CountUser

    user_dupes = (
        StaffProfile.objects.filter(deleted_at__isnull=True)
        .values("user")
        .annotate(cnt=CountUser("id"))
        .filter(cnt__gt=1)
    )
    if user_dupes.exists():
        for row in user_dupes:
            conflicts.append(f"StaffProfile.user={row['user']} appears {row['cnt']} times")

    if conflicts:
        conflict_list = "\n  ".join(conflicts)
        raise SystemExit(
            f"\n\nMigration ABORTED: Duplicate values found that violate new global unique constraints.\n"
            f"Please resolve the following conflicts manually before re-running migration:\n\n  {conflict_list}\n"
        )


def set_linked_workspace_null(apps, schema_editor):
    """Set linked_workspace = None for all departments (admin links manually post-migration)."""
    # Field is added as null, no action needed — values default to NULL
    pass


def reverse_noop(apps, schema_editor):
    """Noop reverse: no backward data migration needed."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0135_rename_backlog_state_display"),
    ]

    operations = [
        # Step 1: Pre-migration duplicate check (blocks migration if conflicts found)
        migrations.RunPython(check_duplicates, reverse_noop),

        # Step 2: Add linked_workspace OneToOneField (nullable) to Department
        migrations.AddField(
            model_name="department",
            name="linked_workspace",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="linked_department",
                to="db.workspace",
            ),
        ),

        # Step 3: Set linked_workspace = null for all (clean slate)
        migrations.RunPython(set_linked_workspace_null, reverse_noop),

        # Step 4: Remove old workspace-scoped unique constraints from Department
        migrations.RemoveConstraint(
            model_name="department",
            name="department_unique_workspace_code",
        ),
        migrations.RemoveConstraint(
            model_name="department",
            name="department_unique_workspace_short_name",
        ),
        migrations.RemoveConstraint(
            model_name="department",
            name="department_unique_workspace_dept_code",
        ),

        # Step 5: Remove old workspace-scoped unique constraints from StaffProfile
        migrations.RemoveConstraint(
            model_name="staffprofile",
            name="staff_unique_workspace_staff_id",
        ),
        migrations.RemoveConstraint(
            model_name="staffprofile",
            name="staff_unique_workspace_user",
        ),

        # Step 6: Remove workspace FK from Department
        migrations.RemoveField(
            model_name="department",
            name="workspace",
        ),

        # Step 7: Remove linked_project FK from Department
        migrations.RemoveField(
            model_name="department",
            name="linked_project",
        ),

        # Step 8: Remove workspace FK from StaffProfile
        migrations.RemoveField(
            model_name="staffprofile",
            name="workspace",
        ),

        # Step 9: Add new globally-unique constraints for Department
        migrations.AddConstraint(
            model_name="department",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=["code"],
                name="department_unique_code",
            ),
        ),
        migrations.AddConstraint(
            model_name="department",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=["short_name"],
                name="department_unique_short_name",
            ),
        ),
        migrations.AddConstraint(
            model_name="department",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=["dept_code"],
                name="department_unique_dept_code",
            ),
        ),

        # Step 10: Add new globally-unique constraints for StaffProfile
        migrations.AddConstraint(
            model_name="staffprofile",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=["staff_id"],
                name="staff_unique_staff_id",
            ),
        ),
        migrations.AddConstraint(
            model_name="staffprofile",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=["user"],
                name="staff_unique_user",
            ),
        ),
    ]
