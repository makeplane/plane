# Third Party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Project,
)
from plane.utils.notifications import IssueNotificationHandler, NotificationContext
from plane.utils.exception_logger import log_exception

@shared_task
def process_issue_notifications(
    issue_id,
    project_id,
    actor_id,
    activities_data,
    requested_data=None,
    current_instance=None,
    subscriber=False,
    notification_type=""
):
    """
    Process notifications for issue activities.
    """
    try:
        # Let the handler normalize and parse activities
        activities = IssueNotificationHandler.parse_activities(activities_data)

        project = Project.objects.get(pk=project_id)
        workspace_id = project.workspace_id
        
        # Create context
        context = NotificationContext(
            entity_id=issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            actor_id=actor_id,
            activities=activities,
            requested_data=requested_data,
            current_instance=current_instance,
            subscriber=subscriber,
            notification_type=notification_type
        )
        
        # Process notifications
        handler = IssueNotificationHandler(context)
        payload = handler.process()
        
        return {
            "success": True,
            "in_app_count": len(payload.in_app_notifications),
            "email_count": len(payload.email_logs),
        }
    except Exception as e:
        log_exception(e)
        return {
            "success": False,
            "error": str(e)
        }