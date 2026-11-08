# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from django.db import DatabaseError, transaction
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import IssueView, UserRecentVisit, Workspace
from plane.utils.exception_logger import log_exception


@shared_task
def recent_visited_task(entity_name, entity_identifier, user_id, project_id, slug):
    """Record recent activity while coordinating saved-view visits with deletion."""
    try:
        with transaction.atomic():
            workspace = Workspace.objects.get(slug=slug)

            # Serialize view-visit creation with saved-view deletion. If deletion
            # committed first, this lookup finds no active view and the stale
            # queued task must not recreate its recent-visit record.
            if entity_name == "view":
                issue_view = IssueView.objects.select_for_update().filter(
                    pk=entity_identifier,
                    workspace_id=workspace.id,
                    project_id=project_id,
                ).first()
                if issue_view is None:
                    return

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
                recent_visited_count = UserRecentVisit.objects.filter(
                    user_id=user_id, workspace_id=workspace.id
                ).count()
                if recent_visited_count == 20:
                    recent_visited = (
                        UserRecentVisit.objects.filter(user_id=user_id, workspace_id=workspace.id)
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

        return
    except Exception as e:
        log_exception(e)
        return
