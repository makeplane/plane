from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0123_bih_schedule_lag_holidays'),
    ]

    operations = [
        migrations.AddField(
            model_name='issuerelation',
            name='dep_type',
            field=models.CharField(db_default='FS', default='FS', max_length=2),
        ),
    ]
