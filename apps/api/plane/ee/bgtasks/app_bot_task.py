# Third party imports
import logging
from typing import List, Optional

from celery import shared_task

# Module imports
from plane.app.permissions.base import ROLE
from plane.authentication.models.oauth import WorkspaceAppInstallation
from plane.db.models.project import Project, ProjectMember
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")


@shared_task
def add_app_bots_to_project(project_id: str, user_id: Optional[str] = None) -> None:
    """
    Background task to add app bot users to a project.
    This ensures any workspace app bot is automatically added as a project member.
    """
    try:
        logger.info(f"Adding app bots to project {project_id}")
        # Get the project
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            logger.info(f"Project with ID {project_id} does not exist")
            return

        # Find all active app installations for this project's workspace
        app_installations = WorkspaceAppInstallation.objects.filter(
            workspace=project.workspace,
            status=WorkspaceAppInstallation.Status.INSTALLED,
            deleted_at__isnull=True,
        ).exclude(app_bot__id=user_id)

        # Create ProjectMember records for each app bot
        project_members: List[ProjectMember] = []

        for installation in app_installations:
            if installation.app_bot:
                pm = ProjectMember(
                    project=project,
                    workspace=project.workspace,
                    member=installation.app_bot,
                    role=ROLE.MEMBER.value,
                )
                if user_id:
                    pm.created_by_id = user_id
                    pm.updated_by_id = user_id
                project_members.append(pm)

        # Bulk create all the project members
        if project_members:
            ProjectMember.objects.bulk_create(project_members, ignore_conflicts=True)
    except Exception as e:
        log_exception(e)
