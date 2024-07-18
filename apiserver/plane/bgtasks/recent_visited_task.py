# Python imports
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import RecentVisited, Workspace
from plane.utils.exception_logger import log_exception


@shared_task
def recent_visited_task(
    entity_name, entity_identifier, actor_id, project_id, slug
):
    try:
        workspace = Workspace.objects.get(slug=slug)
        recent_visited = RecentVisited.objects.filter(
            entity_name=entity_name,
            entity_identifier=entity_identifier,
            actor_id=actor_id,
            project_id=project_id,
            workspace_id=workspace.id,
        ).first()

        if recent_visited:
            recent_visited.visited_at = timezone.now()
            recent_visited.save(update_fields=["visited_at"])
        else:
            recent_visited_count = RecentVisited.objects.filter(
                actor_id=actor_id, workspace_id=workspace.id
            ).count()

            if recent_visited_count == 20:
                recent_visited = RecentVisited.objects.filter(
                    actor_id=actor_id, workspace_id=workspace.id
                ).order_by("created").first()
                recent_visited.delete()

            recent_activity = RecentVisited.objects.create(
                entity_name=entity_name,
                entity_identifier=entity_identifier,
                actor_id=actor_id,
                visited_at=timezone.now(),
                project_id=project_id,
                workspace_id=workspace.id,
            )
            recent_activity.created_by_id = actor_id
            recent_activity.updated_by_id = actor_id
            recent_activity.save(
                update_fields=["created_by_id", "updated_by_id"]
            )

        return
    except Exception as e:
        log_exception(e)
        return
