# Python standard library imports
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from uuid import UUID

# Django imports
from django.utils import timezone

# Third party imports
from celery import shared_task

# Plane imports
from plane.db.models import Cycle
from plane.ee.models import EntityProgress, EntityIssueStateActivity
from plane.utils.exception_logger import log_exception


@shared_task
def calculate_entity_issue_state_progress(
    current_date: Optional[datetime] = None,
    cycles: List[Tuple[UUID, UUID]] = None
) -> Optional[List[EntityProgress]]:
    """
    Calculate progress for entity issues based on their state.

    Args:
        current_date: The date to calculate progress for. Defaults to yesterday.
        cycles: List of tuples containing (cycle_id, workspace_id). If not provided, active cycles are fetched.

    Returns:
        List of EntityProgress objects or None if an exception occurred.
    """
    if cycles is None:
        cycles = []

    if not current_date:
        current_date = timezone.now() - timezone.timedelta(days=1)

    try:
        if not cycles:
            cycles = Cycle.objects.filter(
                start_date__lte=timezone.now(),
                end_date__gte=(timezone.now() + timezone.timedelta(days=1)),
            ).values_list("id", "workspace_id")

        analytics_records: List[EntityProgress] = []
        batch_size: int = 100

        for i in range(0, len(cycles), batch_size):
            batch_cycles = cycles[i:i+batch_size]
            # Create a dictionary for quick lookup of workspace_id by cycle_id
            cycle_id_to_workspace: Dict[UUID, UUID] = {
                cycle_id: workspace_id for cycle_id, workspace_id in batch_cycles
            }
            cycle_ids: List[UUID] = list(cycle_id_to_workspace.keys())

            # Get the latest activity for each issue in each cycle with a single query using distinct
            latest_activities = EntityIssueStateActivity.objects.filter(
                cycle_id__in=cycle_ids,
                entity_type="CYCLE",
                created_at__lte=timezone.now(),
                action__in=["ADDED", "UPDATED"],
                issue__deleted_at__isnull=True,
                issue__issue_cycle__deleted_at__isnull=True,
            ).order_by('cycle_id', 'issue_id', '-created_at').distinct('cycle_id', 'issue_id').values(
                'cycle_id', 'issue_id', 'state_group', 'estimate_value'
            )

            # Group the activities by cycle_id
            cycle_activities: Dict[UUID, List[Dict[str, Any]]] = {}
            for activity in latest_activities:
                if activity['cycle_id'] not in cycle_activities:
                    cycle_activities[activity['cycle_id']] = []
                cycle_activities[activity['cycle_id']].append(activity)

            # Process each cycle's data
            for cycle_id in cycle_ids:
                activities = cycle_activities.get(cycle_id, [])
                total_issues: int = len(activities)
                total_estimate_points: float = sum(activity['estimate_value'] or 0 for activity in activities)

                # Count issues and estimate points by state group
                state_groups: List[str] = ["backlog", "unstarted", "started", "completed", "cancelled"]
                state_counts: Dict[str, int] = {group: 0 for group in state_groups}
                state_points: Dict[str, float] = {group: 0 for group in state_groups}

                for activity in activities:
                    group = activity['state_group']
                    if group in state_groups:
                        state_counts[group] += 1
                        state_points[group] += activity['estimate_value'] or 0

                # Create analytics record
                analytics_records.append(
                    EntityProgress(
                        cycle_id=cycle_id,
                        progress_date=current_date,
                        entity_type="CYCLE",
                        total_issues=total_issues,
                        total_estimate_points=total_estimate_points,
                        backlog_issues=state_counts["backlog"],
                        unstarted_issues=state_counts["unstarted"],
                        started_issues=state_counts["started"],
                        completed_issues=state_counts["completed"],
                        cancelled_issues=state_counts["cancelled"],
                        backlog_estimate_points=state_points["backlog"],
                        unstarted_estimate_points=state_points["unstarted"],
                        started_estimate_points=state_points["started"],
                        completed_estimate_points=state_points["completed"],
                        cancelled_estimate_points=state_points["cancelled"],
                        created_at=timezone.now(),
                        updated_at=timezone.now(),
                        workspace_id=cycle_id_to_workspace[cycle_id],
                    )
                )

        return analytics_records

    except Exception as e:
        log_exception(e)
        return None
