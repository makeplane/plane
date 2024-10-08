# Django imports
from django.db.models import Sum
from django.utils import timezone
from django.db.models import F
from django.db.models.functions import RowNumber
from django.db.models import Max, Subquery, OuterRef
# Django imports
from django.core.management.base import BaseCommand, CommandError


# Third party imports
from celery import shared_task
from plane.db.models import Cycle
from plane.ee.models import EntityIssueStateActivity, EntityProgress

# @shared_task
# Module imports
from plane.license.models import Instance, InstanceAdmin
from plane.db.models import User


def helper(current_date, i):
    active_cycles = Cycle.objects.filter(
        start_date__lte=timezone.now(), end_date__gte=timezone.now()
    ).values_list("id", "project_id", "workspace_id")

    analytics_records = []
    for cycle_id, project_id, workspace_id in active_cycles:
        print(cycle_id, project_id)
        # Subquery to get the latest id for each issue_id
        # Subquery to get the latest created_at for each issue_id
        # latest_created_at = CycleIssueStateProgress.objects.filter(
        #     cycle_id=cycle_id,
        #     type__in=["ADDED", "UPDATED"],
        #     issue_id=OuterRef("issue_id"),
        #     created_at__lte=timezone.now(),
        # ).values('issue_id').annotate(
        #     latest_created=Max('created_at')
        # ).values('latest_created')

        # # Main query to get the latest unique issues
        # cycle_issues = CycleIssueStateProgress.objects.filter(
        #     cycle_id=cycle_id,
        #     type__in=["ADDED", "UPDATED"],
        #     created_at=Subquery(latest_created_at),
        #     issue_id=OuterRef("issue_id")
        # ).order_by("issue_id")
        cycle_issues = EntityIssueStateActivity.objects.filter(
            id=Subquery(
                EntityIssueStateActivity.objects.filter(
                    cycle_id=cycle_id,
                    action__in=["ADDED", "UPDATED"],
                    issue=OuterRef("issue"),
                    entity_type="CYCLE"
                )
                .order_by("-created_at")
                .values("id")[:1]
            )
        )
        print(cycle_issues)

        for issue in cycle_issues.values():
            print(issue, "issues")

        total_issues = cycle_issues.count()
        total_estimate_points = (
            cycle_issues.aggregate(
                total_estimate_points=Sum("estimate_value")
            )["total_estimate_points"]
            or 0
        )

        state_groups = [
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
        ]
        state_data = {
            group: {
                "count": cycle_issues.filter(state_group=group).count(),
                "estimate_points": cycle_issues.filter(
                    state_group=group
                ).aggregate(total_estimate_points=Sum("estimate_value"))[
                    "total_estimate_points"
                ]
                or 0,
            }
            for group in state_groups
        }

        # Prepare analytics record for bulk insert
        analytics_records.append(
            EntityProgress(
                entity_type="CYCLE",
                cycle_id=cycle_id,
                progress_date=current_date,
                total_issues=total_issues,
                total_estimate_points=total_estimate_points,
                backlog_issues=state_data["backlog"]["count"],
                unstarted_issues=state_data["unstarted"]["count"] - i,
                started_issues=state_data["started"]["count"]+ i,
                completed_issues=state_data["completed"]["count"] + i,
                cancelled_issues=state_data["cancelled"]["count"],
                backlog_estimate_points=state_data["backlog"][
                    "estimate_points"
                ]
                - i,
                unstarted_estimate_points=state_data["unstarted"][
                    "estimate_points"
                ]
                - i,
                started_estimate_points=state_data["started"][
                    "estimate_points"
                ]
                + i,
                completed_estimate_points=state_data["completed"][
                    "estimate_points"
                ]
                + i,
                cancelled_estimate_points=state_data["cancelled"][
                    "estimate_points"
                ]
                - i,
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

    # Bulk create the records at once
    if analytics_records:
        EntityProgress.objects.bulk_create(analytics_records)



class Command(BaseCommand):
    help = "Add a new instance admin"


    def handle(self, *args, **options):
        current_date = timezone.now()
        for i in range(1, 8):
            delta = timezone.timedelta(days=1 - i)
            print("delta", delta, current_date)
            helper(current_date + delta, i)