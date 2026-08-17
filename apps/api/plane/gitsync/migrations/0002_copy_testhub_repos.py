# Generated for gitsync overlay — copy legacy testhub one-to-one binds

from django.db import migrations


def copy_testhub_repos(apps, schema_editor):
    ProjectTestRepo = apps.get_model("testhub", "ProjectTestRepo")
    ProjectGitRemote = apps.get_model("gitsync", "ProjectGitRemote")
    ModuleBinding = apps.get_model("gitsync", "ModuleBinding")
    for repo in ProjectTestRepo.objects.all():
        if ProjectGitRemote.objects.filter(project_id=repo.project_id).exists():
            continue
        remote = ProjectGitRemote.objects.create(
            project_id=repo.project_id,
            workspace_id=repo.workspace_id,
            name="Test repository",
            kind="local_mount",
            workdir=repo.workdir or "/opt/testhub/workdir",
            repo_url=repo.repo_url or "",
            branch=repo.branch or "",
            last_sync_sha=repo.last_sync_sha or "",
            last_sync_at=repo.last_sync_at,
            last_sync_status=repo.last_sync_status or "",
            last_sync_error=repo.last_sync_error or "",
            created_by_id=repo.created_by_id,
            updated_by_id=repo.updated_by_id,
        )
        ModuleBinding.objects.create(
            project_id=repo.project_id,
            workspace_id=repo.workspace_id,
            module_key="testhub",
            remote=remote,
            created_by_id=repo.created_by_id,
            updated_by_id=repo.updated_by_id,
        )


def noop(apps, schema_editor):
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("gitsync", "0001_initial"),
        ("testhub", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(copy_testhub_repos, noop),
    ]
