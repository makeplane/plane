from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0121_customplaylist_subtitle"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE custom_playlists DROP COLUMN IF EXISTS annotations;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
