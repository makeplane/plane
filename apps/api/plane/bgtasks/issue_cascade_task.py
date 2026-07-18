# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json

# Third party imports
from celery import shared_task

# Django imports
from django.utils import timezone

# Module imports
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, State, StateGroup
from plane.utils.exception_logger import log_exception

# State groups that are considered terminal (closed) for the cascade.
TERMINAL_GROUPS = [StateGroup.COMPLETED.value, StateGroup.CANCELLED.value]

# Safety cap on how deep the sub-issue tree is walked. Issue.parent is a plain
# self referencing FK with no cycle guard, so this bounds pathological data.
MAX_DEPTH = 20


@shared_task
def cascade_state_to_sub_issues(parent_issue_id, new_state_id, actor_id, project_id, epoch):
    """Mirror a parent's closing state onto its non-terminal descendants.

    When a parent issue enters a completed/cancelled group, every descendant
    (recursively, via Issue.parent) that is not already in a terminal group is
    moved to the parent's new state. The operation is idempotent and close-only:
    descendants already in a completed/cancelled group are left untouched, but
    the walk still continues through them to reach deeper open descendants.
    """
    try:
        # Resolve the target state and confirm it is a terminal (closing) state.
        new_state = State.all_state_objects.filter(id=new_state_id).first()
        if new_state is None or new_state.group not in TERMINAL_GROUPS:
            return

        completed_at = timezone.now() if new_state.group == StateGroup.COMPLETED.value else None

        # Breadth first walk over descendants with a visited set + depth cap.
        visited = {str(parent_issue_id)}
        frontier = [str(parent_issue_id)]
        issues_to_update = []
        depth = 0

        while frontier and depth < MAX_DEPTH:
            children = list(
                Issue.issue_objects.filter(
                    parent_id__in=frontier,
                    project_id=project_id,
                    deleted_at__isnull=True,
                ).select_related("state")
            )

            next_frontier = []
            for child in children:
                child_id = str(child.id)
                if child_id in visited:
                    continue
                visited.add(child_id)
                # Continue traversing through every child, even terminal ones,
                # so open grandchildren under a closed child are still reached.
                next_frontier.append(child_id)

                # Skip descendants already in a terminal group (close-only).
                if child.state and child.state.group in TERMINAL_GROUPS:
                    continue

                child.state_id = new_state_id
                child.completed_at = completed_at
                child.updated_at = timezone.now()
                issues_to_update.append(child)

            frontier = next_frontier
            depth += 1

        if not issues_to_update:
            return

        Issue.objects.bulk_update(issues_to_update, ["state", "completed_at", "updated_at"], batch_size=100)

        [
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"closed_to": str(new_state_id)}),
                actor_id=str(actor_id),
                issue_id=issue.id,
                project_id=project_id,
                current_instance=None,
                subscriber=False,
                epoch=epoch,
                notification=True,
            )
            for issue in issues_to_update
        ]
        return
    except Exception as e:
        log_exception(e)
        return
