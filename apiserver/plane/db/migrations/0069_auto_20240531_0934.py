import django.db.models.deletion
from django.db import migrations, models


def issue_estimate_point(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    EstimatePoint = apps.get_model("db", "EstimatePoint")
    Issue = apps.get_model("db", "Issue")
    updated_estimate_point = []

    # loop through all the projects
    for project in Project.objects.filter(estimate__isnull=False):
        estimate_points = EstimatePoint.objects.filter(
            estimate=project.estimate, project=project
        )
        for issue in Issue.objects.filter(
            point__isnull=False, project=project
        ):
            # get the estimate id for the corresponding estimate point in the issue
            estimate = estimate_points.filter(key=issue.point).first()
            issue.estimate_point = estimate
            updated_estimate_point.append(issue)

    Issue.objects.bulk_update(
        updated_estimate_point, ["estimate_point"], batch_size=1000
    )


def last_used_estimate(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    Estimate = apps.get_model("db", "Estimate")

    # Get all estimate ids used in projects
    estimate_ids = Project.objects.filter(estimate__isnull=False).values_list(
        "estimate", flat=True
    )

    # Update all matching estimates
    Estimate.objects.filter(id__in=estimate_ids).update(last_used=True)


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0068_estimate_last_used"),
    ]

    operations = [
        # Rename the existing field
        migrations.RenameField(
            model_name="issue",
            old_name="estimate_point",
            new_name="point",
        ),
        # Add a new field with the original name as a foreign key
        migrations.AddField(
            model_name="issue",
            name="estimate_point",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="issue_estimate",
                to="db.EstimatePoint",
                blank=True,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="estimate",
            name="type",
            field=models.CharField(default="categories", max_length=255),
        ),
        migrations.RunPython(issue_estimate_point),
        migrations.RunPython(last_used_estimate),
    ]
