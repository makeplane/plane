from django.db import migrations, models


def _grant_access(member_model, lookup, create_values):
    member = member_model.objects.filter(**lookup, deleted_at__isnull=True).first()
    if member is None:
        member_model.objects.create(
            **lookup,
            **create_values,
            role=20,
            is_active=True,
            is_instance_admin_access=True,
        )
        return

    if not member.is_instance_admin_access:
        member.instance_admin_previous_role = member.role if member.is_active else None
    member.role = 20
    member.is_active = True
    member.is_instance_admin_access = True
    member.save(
        update_fields=[
            "role",
            "is_active",
            "is_instance_admin_access",
            "instance_admin_previous_role",
        ]
    )


def grant_existing_instance_admin_access(apps, schema_editor):
    InstanceAdmin = apps.get_model("license", "InstanceAdmin")
    Workspace = apps.get_model("db", "Workspace")
    WorkspaceMember = apps.get_model("db", "WorkspaceMember")
    Project = apps.get_model("db", "Project")
    ProjectMember = apps.get_model("db", "ProjectMember")

    admins = InstanceAdmin.objects.filter(
        deleted_at__isnull=True,
        role__gte=15,
        user_id__isnull=False,
    )
    workspaces = list(Workspace.objects.filter(deleted_at__isnull=True))
    projects = list(Project.objects.filter(deleted_at__isnull=True))

    for admin in admins.iterator():
        for workspace in workspaces:
            _grant_access(
                WorkspaceMember,
                {"workspace_id": workspace.id, "member_id": admin.user_id},
                {},
            )
        for project in projects:
            _grant_access(
                ProjectMember,
                {"project_id": project.id, "member_id": admin.user_id},
                {"workspace_id": project.workspace_id},
            )


def revoke_existing_instance_admin_access(apps, schema_editor):
    WorkspaceMember = apps.get_model("db", "WorkspaceMember")
    ProjectMember = apps.get_model("db", "ProjectMember")

    for member_model in (ProjectMember, WorkspaceMember):
        for member in member_model.objects.filter(is_instance_admin_access=True).iterator():
            if member.instance_admin_previous_role is None:
                member.is_active = False
            else:
                member.role = member.instance_admin_previous_role
            member.is_instance_admin_access = False
            member.instance_admin_previous_role = None
            member.save(
                update_fields=[
                    "role",
                    "is_active",
                    "is_instance_admin_access",
                    "instance_admin_previous_role",
                ]
            )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0125_profile_language_default_ru"),
        ("license", "0007_instanceadmin_roles"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspacemember",
            name="is_instance_admin_access",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="workspacemember",
            name="instance_admin_previous_role",
            field=models.PositiveSmallIntegerField(
                blank=True,
                choices=[(20, "Admin"), (15, "Member"), (5, "Guest")],
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="projectmember",
            name="is_instance_admin_access",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="projectmember",
            name="instance_admin_previous_role",
            field=models.PositiveSmallIntegerField(
                blank=True,
                choices=[(20, "Admin"), (15, "Member"), (5, "Guest")],
                null=True,
            ),
        ),
        migrations.RunPython(
            grant_existing_instance_admin_access,
            revoke_existing_instance_admin_access,
        ),
    ]
