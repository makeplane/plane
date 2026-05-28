"""
Workspace signals.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender="db.WorkspaceMember")
def auto_add_admin_to_all_projects(sender, instance, created, **kwargs):
    """Auto-join new Admin workspace members to all workspace projects (active + archived).

    NOTE: Fires once per WorkspaceMember.objects.create() call, including bulk-admin
    flows (e.g. department sync). Each invocation runs 2–3 DB queries against all
    workspace projects. If this becomes a bottleneck, move to a Celery on_commit task.
    """
    if not created or instance.role != 20 or not instance.is_active:
        return

    from plane.db.models import Project, ProjectMember, ProjectUserProperty  # avoid circular imports

    projects = list(Project.objects.filter(workspace_id=instance.workspace_id))
    if not projects:
        return

    existing_project_ids = set(
        ProjectMember.objects.filter(
            project__workspace_id=instance.workspace_id,
            member_id=instance.member_id,
            deleted_at__isnull=True,  # skip soft-deleted memberships
        ).values_list("project_id", flat=True)
    )

    new_members = [
        ProjectMember(
            project=project,
            workspace_id=instance.workspace_id,  # required: bulk_create bypasses ProjectBaseModel.save()
            member_id=instance.member_id,
            role=20,  # Project Admin
            created_by=instance.created_by,
        )
        for project in projects
        if project.id not in existing_project_ids
    ]

    if not new_members:
        return

    ProjectMember.objects.bulk_create(new_members, ignore_conflicts=True)

    # bulk_create bypasses ProjectMember.save() which normally creates ProjectUserProperty;
    # create it explicitly so the member's per-project issue display preferences exist.
    ProjectUserProperty.objects.bulk_create(
        [
            ProjectUserProperty(
                project=member.project,
                workspace_id=instance.workspace_id,
                user_id=instance.member_id,
                created_by=instance.created_by,
            )
            for member in new_members
        ],
        ignore_conflicts=True,
    )
