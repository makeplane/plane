"""
Celery task for bulk retroactive workspace membership sync.
Triggered when a department is linked to a workspace with >10 active staff.
"""

# Django imports
from django.db import transaction

# Third party imports
from celery import shared_task

# Module imports
from plane.utils.exception_logger import log_exception


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def sync_department_workspace_members(self, department_id: str, workspace_id: str) -> None:
    """
    Add all active staff in department as WorkspaceMembers (role=15).
    Also adds ancestor department managers to the workspace.
    """
    try:
        from plane.db.models import Department, StaffProfile, Workspace, WorkspaceMember

        dept = Department.objects.get(id=department_id)
        workspace = Workspace.objects.get(id=workspace_id)

        staff_list = StaffProfile.objects.filter(
            department=dept,
            employment_status="active",
            deleted_at__isnull=True,
        ).select_related("user")

        with transaction.atomic():
            for staff in staff_list:
                WorkspaceMember.objects.get_or_create(
                    workspace=workspace,
                    member=staff.user,
                    defaults={"role": 15},
                )

            # Add ancestor managers so they have visibility into the workspace
            parent = dept.parent
            while parent:
                if parent.manager:
                    WorkspaceMember.objects.get_or_create(
                        workspace=workspace,
                        member=parent.manager,
                        defaults={"role": 15},
                    )
                parent = parent.parent

    except Exception as exc:
        log_exception(exc)
        raise self.retry(exc=exc)
