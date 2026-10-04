# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from django.utils import timezone
from django.db import DatabaseError

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import UserRecentVisit, Workspace
from plane.utils.exception_logger import log_exception


@shared_task
def recent_visited_task(entity_name, entity_identifier, user_id, project_id, slug):
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
            recent_visited_count = UserRecentVisit.objects.filter(user_id=user_id, workspace_id=workspace.id).count()
            if recent_visited_count == 20:
                recent_visited = (
                    UserRecentVisit.objects.filter(user_id=user_id, workspace_id=workspace.id)
                    .order_by("created_at")
                    .first()
                )
                recent_visited.delete()

            # Set the audit fields in the INSERT itself: a follow-up save can hit a row
            # that a concurrent task already evicted (the cap-at-20 delete above).
            # disable_auto_set_user keeps BaseModel.save from nulling them (no request user here).
            UserRecentVisit(
                entity_name=entity_name,
                entity_identifier=entity_identifier,
                user_id=user_id,
                visited_at=timezone.now(),
                project_id=project_id,
                workspace_id=workspace.id,
                created_by_id=user_id,
                updated_by_id=user_id,
            ).save(disable_auto_set_user=True)

        return
    except Exception as e:
        log_exception(e)
        return
