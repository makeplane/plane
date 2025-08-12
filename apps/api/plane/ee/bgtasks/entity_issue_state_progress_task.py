from celery import shared_task
from plane.db.models import Issue
from plane.ee.models import EntityProgress, EntityIssueStateActivity
from plane.utils.exception_logger import log_exception
from plane.ee.utils.entity_state_progress import calculate_entity_issue_state_progress


@shared_task
def track_entity_issue_state_progress(current_date=None, cycles=[]):
    try:
        analytics_records = calculate_entity_issue_state_progress(current_date, cycles)
        if analytics_records:
            EntityProgress.objects.bulk_create(analytics_records)
    except Exception as e:
        log_exception(e)


@shared_task
def entity_issue_state_activity_task(issue_cycle_data, user_id, slug, action):
    """
    issue_cycle_data: List[Dict[str, str]] = [{"issue_id": "...", "cycle_id": "..."}, ...]
    """
    try:
        issue_ids = [item["issue_id"] for item in issue_cycle_data]
        cycle_id_map = {item["issue_id"]: item["cycle_id"] for item in issue_cycle_data}

        issues = Issue.all_objects.filter(id__in=issue_ids).select_related(
            "estimate_point", "estimate_point__estimate", "state"
        )

        activity_records = []

        for issue in issues:
            issue_id_str = str(issue.id)
            cycle_id = cycle_id_map.get(issue_id_str)
            if not cycle_id:
                continue

            estimate_value = (
                issue.estimate_point.value
                if issue.estimate_point
                and issue.estimate_point.estimate
                and getattr(issue.estimate_point.estimate, "type", None)
                in ["points", "time"]
                else None
            )

            activity_records.append(
                EntityIssueStateActivity(
                    cycle_id=cycle_id,
                    state_id=str(issue.state_id),
                    issue_id=issue.id,
                    state_group=issue.state.group if issue.state else None,
                    action=action,
                    entity_type="CYCLE",
                    estimate_point_id=issue.estimate_point_id,
                    estimate_value=estimate_value,
                    workspace_id=issue.workspace_id,
                    created_by_id=user_id,
                    updated_by_id=user_id,
                )
            )

        if activity_records:
            EntityIssueStateActivity.objects.bulk_create(
                activity_records, batch_size=10
            )

    except Exception as e:
        log_exception(e)
