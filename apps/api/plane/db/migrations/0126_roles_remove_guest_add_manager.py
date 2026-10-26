# d2m-plane: remove the Guest role (guests become Members) and add the project "Manager" flag.

from django.db import migrations, models

ROLE_CHOICES = [(20, "Admin"), (15, "Member")]
GUEST, MEMBER = 5, 15


def guests_to_members(apps, schema_editor):
    for model_name in ("ProjectMember", "ProjectMemberInvite", "WorkspaceMember", "WorkspaceMemberInvite"):
        model = apps.get_model("db", model_name)
        manager = getattr(model, "all_objects", None) or model._default_manager
        manager.filter(role=GUEST).update(role=MEMBER)


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0125_state_is_closed"),
    ]

    operations = [
        migrations.RunPython(guests_to_members, migrations.RunPython.noop),
        migrations.AddField(
            model_name="projectmember",
            name="is_manager",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="projectmember",
            name="role",
            field=models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=15),
        ),
        migrations.AlterField(
            model_name="projectmemberinvite",
            name="role",
            field=models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=15),
        ),
        migrations.AlterField(
            model_name="workspacemember",
            name="role",
            field=models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=15),
        ),
        migrations.AlterField(
            model_name="workspacememberinvite",
            name="role",
            field=models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=15),
        ),
    ]
