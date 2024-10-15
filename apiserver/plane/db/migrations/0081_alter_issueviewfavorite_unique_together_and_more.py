# Generated by Django 4.2.16 on 2024-10-15 11:01

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0080_fileasset_draft_issue_alter_fileasset_entity_type"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="issueviewfavorite",
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name="issueviewfavorite",
            name="created_by",
        ),
        migrations.RemoveField(
            model_name="issueviewfavorite",
            name="project",
        ),
        migrations.RemoveField(
            model_name="issueviewfavorite",
            name="updated_by",
        ),
        migrations.RemoveField(
            model_name="issueviewfavorite",
            name="user",
        ),
        migrations.RemoveField(
            model_name="issueviewfavorite",
            name="view",
        ),
        migrations.RemoveField(
            model_name="issueviewfavorite",
            name="workspace",
        ),
        migrations.AlterUniqueTogether(
            name="modulefavorite",
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name="modulefavorite",
            name="created_by",
        ),
        migrations.RemoveField(
            model_name="modulefavorite",
            name="module",
        ),
        migrations.RemoveField(
            model_name="modulefavorite",
            name="project",
        ),
        migrations.RemoveField(
            model_name="modulefavorite",
            name="updated_by",
        ),
        migrations.RemoveField(
            model_name="modulefavorite",
            name="user",
        ),
        migrations.RemoveField(
            model_name="modulefavorite",
            name="workspace",
        ),
        migrations.AlterUniqueTogether(
            name="pagefavorite",
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name="pagefavorite",
            name="created_by",
        ),
        migrations.RemoveField(
            model_name="pagefavorite",
            name="page",
        ),
        migrations.RemoveField(
            model_name="pagefavorite",
            name="project",
        ),
        migrations.RemoveField(
            model_name="pagefavorite",
            name="updated_by",
        ),
        migrations.RemoveField(
            model_name="pagefavorite",
            name="user",
        ),
        migrations.RemoveField(
            model_name="pagefavorite",
            name="workspace",
        ),
        migrations.AlterUniqueTogether(
            name="projectfavorite",
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name="projectfavorite",
            name="created_by",
        ),
        migrations.RemoveField(
            model_name="projectfavorite",
            name="project",
        ),
        migrations.RemoveField(
            model_name="projectfavorite",
            name="updated_by",
        ),
        migrations.RemoveField(
            model_name="projectfavorite",
            name="user",
        ),
        migrations.RemoveField(
            model_name="projectfavorite",
            name="workspace",
        ),
        migrations.AddField(
            model_name="issuetype",
            name="external_id",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="issuetype",
            name="external_source",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.DeleteModel(
            name="CycleFavorite",
        ),
        migrations.DeleteModel(
            name="IssueViewFavorite",
        ),
        migrations.DeleteModel(
            name="ModuleFavorite",
        ),
        migrations.DeleteModel(
            name="PageFavorite",
        ),
        migrations.DeleteModel(
            name="ProjectFavorite",
        ),
    ]
