# Generated for gitsync overlay — allow environments module bindings

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gitsync", "0002_copy_testhub_repos"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="modulebinding",
            name="gitsync_binding_known_module",
        ),
        migrations.AddConstraint(
            model_name="modulebinding",
            constraint=models.CheckConstraint(
                condition=models.Q(module_key__in=("testhub", "features", "environments", "wiki", "prd")),
                name="gitsync_binding_known_module",
            ),
        ),
    ]
