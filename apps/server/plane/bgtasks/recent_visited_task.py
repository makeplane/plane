# Python imports
from django.utils import timezone
from django.db import DatabaseError

# Third party imports
from celery import shared_task

# Module imports
from django.db.models import Q
from plane.db.models import UserRecentVisit, Workspace
from plane.utils.exception_logger import log_exception


@shared_task
def recent_visited_task(entity_name, entity_identifier, user_id, slug, project_id=None):
    try:
        workspace = Workspace.objects.get(slug=slug)
        recent_visited = UserRecentVisit.objects.filter(
            entity_name=entity_name,
            entity_identifier=entity_identifier,
            user_id=user_id,
            project_id=project_id,
            workspace_id=workspace.id,
        ).first()

        if recent_visited:
            # Check if the database is available
            try:
                recent_visited.visited_at = timezone.now()
                recent_visited.save(update_fields=["visited_at"])
            except DatabaseError:
                pass
        else:
            # Delete records beyond the 20 most recent visits, excluding "PAGE" entity records
            recent_visited_ids = (
                UserRecentVisit.objects.filter(
                    user_id=user_id,
                    workspace_id=workspace.id,
                )
                .exclude(entity_name="workspace_page")
                .order_by("-created_at")
                .values_list("id", flat=True)[20:]
            )

            UserRecentVisit.objects.filter(id__in=recent_visited_ids).delete(soft=False)

            # Delete records beyond the 20 most recent visits for "workspace_page" entities
            recent_page_visited_ids = (
                UserRecentVisit.objects.filter(
                    entity_name="workspace_page",
                    user_id=user_id,
                    workspace_id=workspace.id,
                )
                .order_by("-created_at")
                .values_list("id", flat=True)[20:]
            )

            UserRecentVisit.objects.filter(id__in=recent_page_visited_ids).delete(
                soft=False
            )

            recent_activity = UserRecentVisit.objects.create(
                entity_name=entity_name,
                entity_identifier=entity_identifier,
                user_id=user_id,
                visited_at=timezone.now(),
                project_id=project_id,
                workspace_id=workspace.id,
            )
            recent_activity.created_by_id = user_id
            recent_activity.updated_by_id = user_id
            recent_activity.save(update_fields=["created_by_id", "updated_by_id"])

        return
    except Exception as e:
        log_exception(e)
        return
