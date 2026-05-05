from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0137_department_optional_code_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspace",
            name="is_board_of_director_workspace",
            field=models.BooleanField(default=False),
        ),
    ]
