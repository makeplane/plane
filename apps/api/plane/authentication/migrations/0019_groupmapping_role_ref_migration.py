# Generated migration for GroupMapping: add role FK, populate from default_role

from django.db import migrations, models
import django.db.models.deletion


# Mapping from old numeric default_role to project-level role slugs
NUMERIC_TO_PROJECT_SLUG = {
    20: "admin",
    15: "contributor",
    5: "guest",
}

# Reverse mapping: project role slug to legacy numeric value
PROJECT_SLUG_TO_NUMERIC = {
    "admin": 20,
    "contributor": 15,
    "commenter": 15,
    "guest": 5,
}


def populate_role_from_default_role(apps, schema_editor):
    """Forward: populate role FK from the legacy numeric default_role field."""
    GroupMapping = apps.get_model("authentication", "GroupMapping")
    Role = apps.get_model("db", "Role")

    for mapping in GroupMapping.objects.filter(deleted_at__isnull=True):
        slug = NUMERIC_TO_PROJECT_SLUG.get(mapping.default_role, "contributor")
        role = Role.objects.filter(
            workspace_id=mapping.workspace_id,
            namespace="project",
            slug=slug,
            is_system=True,
            deleted_at__isnull=True,
        ).first()

        if role:
            mapping.role_id = role.id
            mapping.save(update_fields=["role_id"])


def populate_default_role_from_role(apps, schema_editor):
    """Reverse: populate numeric default_role from role FK."""
    GroupMapping = apps.get_model("authentication", "GroupMapping")
    Role = apps.get_model("db", "Role")

    for mapping in GroupMapping.objects.filter(
        deleted_at__isnull=True, role_id__isnull=False
    ):
        role = Role.objects.filter(id=mapping.role_id).first()
        if role:
            mapping.default_role = PROJECT_SLUG_TO_NUMERIC.get(role.slug, 15)
            mapping.save(update_fields=["default_role"])


def populate_default_workspace_role(apps, schema_editor):
    """Forward: set default_workspace_role to the workspace 'member' role for all configs."""
    GroupSyncConfig = apps.get_model("authentication", "GroupSyncConfig")
    Role = apps.get_model("db", "Role")

    for config in GroupSyncConfig.objects.filter(deleted_at__isnull=True):
        member_role = Role.objects.filter(
            workspace_id=config.workspace_id,
            namespace="workspace",
            slug="member",
            is_system=True,
            deleted_at__isnull=True,
        ).first()
        if member_role:
            config.default_workspace_role_id = member_role.id
            config.save(update_fields=["default_workspace_role_id"])
            

class Migration(migrations.Migration):

    dependencies = [
        ("db", "0136_auto_20260130_0910"),
        ("authentication", "0018_identityprovider_attribute_mapping_and_more"),
    ]

    operations = [
        # Step 1: Add role FK (nullable initially)
        migrations.AddField(
            model_name="groupmapping",
            name="role",
            field=models.ForeignKey(
                help_text="Project-scoped Role to assign when syncing members via this mapping.",
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="group_mappings",
                to="db.role",
            ),
        ),
        # Step 2: Make default_role nullable (deprecated, kept for rollback)
        #
        # This MUST come before the RunPython so the reverse order is:
        #   4r. role → nullable
        #   3r. RunPython reverse (populates default_role from role)
        #   2r. default_role → non-nullable   ← safe because 3r already filled it
        #   1r. RemoveField role
        migrations.AlterField(
            model_name="groupmapping",
            name="default_role",
            field=models.PositiveSmallIntegerField(null=True, blank=True),
        ),
        # Step 3: Data migration (populate role FK from default_role)
        # Reverse: populate default_role from role FK (runs before default_role
        # is made non-nullable again in the reverse of step 2)
        migrations.RunPython(
            populate_role_from_default_role,
            reverse_code=populate_default_role_from_role,
        ),
        # Step 4: Make role non-nullable (all rows now have a value)
        migrations.AlterField(
            model_name="groupmapping",
            name="role",
            field=models.ForeignKey(
                help_text="Project-scoped Role to assign when syncing members via this mapping.",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="group_mappings",
                to="db.role",
            ),
        ),
        # Step 5: Add default_workspace_role (nullable initially)
        migrations.AddField(
            model_name="groupsyncconfig",
            name="default_workspace_role",
            field=models.ForeignKey(
                help_text="Workspace-scoped Role to assign when a user is auto-added to the workspace via group sync.",
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="workspace_group_sync_configs",
                to="db.role",
            ),
        ),
        # Step 6: Populate default_workspace_role with "member" for existing configs
        migrations.RunPython(
            populate_default_workspace_role,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
