# Python imports
from django.utils import timezone
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import UserRecentVisit, Workspace
from plane.utils.exception_logger import log_exception
from plane.settings.redis import redis_instance


@shared_task(queue=settings.TASK_LOW_QUEUE)
def recent_visited_task(entity_name, entity_identifier, user_id, project_id, slug):
    try:
        ri = redis_instance()
        # Check if the same entity is set in redis for the user
        if ri.exists(f"recent_visited:{user_id}:{entity_name}:{entity_identifier}"):
            return

        # Check if the same entity is set in redis for the workspace
        workspace = Workspace.objects.get(slug=slug)
        recent_visited = UserRecentVisit.objects.filter(
            entity_name=entity_name,
            entity_identifier=entity_identifier,
            user_id=user_id,
            project_id=project_id,
            workspace_id=workspace.id,
        ).first()

        if recent_visited:
            recent_visited.visited_at = timezone.now()
            recent_visited.save(update_fields=["visited_at"])
        else:
            recent_visited_count = UserRecentVisit.objects.filter(
                user_id=user_id, workspace_id=workspace.id
            ).count()
            if recent_visited_count == 20:
                recent_visited = (
                    UserRecentVisit.objects.filter(
                        user_id=user_id, workspace_id=workspace.id
                    )
                    .order_by("created_at")
                    .first()
                )
                recent_visited.delete()

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

        # Set in redis
        ri.set(
            f"recent_visited:{user_id}:{entity_name}:{entity_identifier}", 1, ex=60 * 10
        )
        return
    except Exception as e:
        log_exception(e)
        return
