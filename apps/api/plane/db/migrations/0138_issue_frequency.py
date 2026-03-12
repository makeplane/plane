from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0137_rename_issueworklog_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="frequency",
            field=models.CharField(
                blank=True,
                choices=[
                    ("daily", "Daily"),
                    ("weekly", "Weekly"),
                    ("bi_weekly", "Bi-weekly"),
                    ("monthly", "Monthly"),
                    ("quarterly", "Quarterly"),
                    ("half_year", "Half-year"),
                    ("yearly", "Yearly"),
                    ("ad_hoc", "Ad-hoc"),
                ],
                max_length=20,
                null=True,
                verbose_name="Issue Frequency",
            ),
        ),
        migrations.AddField(
            model_name="issueversion",
            name="frequency",
            field=models.CharField(
                blank=True,
                choices=[
                    ("daily", "Daily"),
                    ("weekly", "Weekly"),
                    ("bi_weekly", "Bi-weekly"),
                    ("monthly", "Monthly"),
                    ("quarterly", "Quarterly"),
                    ("half_year", "Half-year"),
                    ("yearly", "Yearly"),
                    ("ad_hoc", "Ad-hoc"),
                ],
                max_length=20,
                null=True,
                verbose_name="Issue Frequency",
            ),
        ),
    ]
