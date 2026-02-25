# Generated migration: change StaffProfile.user from OneToOneField to ForeignKey

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("db", "0121_department_staffprofile_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="staffprofile",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="staff_profiles",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
