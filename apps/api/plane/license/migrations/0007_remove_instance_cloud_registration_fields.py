from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("license", "0006_instance_is_current_version_deprecated"),
    ]

    operations = [
        migrations.RemoveField(model_name="instance", name="domain"),
        migrations.RemoveField(model_name="instance", name="edition"),
        migrations.RemoveField(model_name="instance", name="is_current_version_deprecated"),
        migrations.RemoveField(model_name="instance", name="is_support_required"),
        migrations.RemoveField(model_name="instance", name="is_telemetry_enabled"),
        migrations.RemoveField(model_name="instance", name="is_test"),
        migrations.RemoveField(model_name="instance", name="is_verified"),
        migrations.RemoveField(model_name="instance", name="last_checked_at"),
        migrations.RemoveField(model_name="instance", name="latest_version"),
        migrations.RemoveField(model_name="instance", name="namespace"),
        migrations.RemoveField(model_name="instanceadmin", name="is_verified"),
    ]
