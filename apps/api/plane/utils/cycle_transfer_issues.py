# Python imports
import json

# Django imports
from django.db.models import (
    Case,
    Count,
    F,
    Q,
    Sum,
    FloatField,
    Value,
    When,
)
from django.db import models
from django.db.models.functions import Cast, Concat
from django.utils import timezone

# Module imports
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    Project,
)
from plane.utils.analytics_plot import burndown_plot
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


def transfer_cycle_issues(
    slug,
    project_id,
    cycle_id,
    new_cycle_id,
    request,
    user_id,
):
    """
    Transfer incomplete issues from one cycle to another and create progress snapshot.

    Args:
        slug: Workspace slug
        project_id: Project ID
        cycle_id: Source cycle ID
        new_cycle_id: Destination cycle ID
        request: HTTP request object
        user_id: User ID performing the transfer

    Returns:
        dict: Response data with success or error message
    """
    # Get the new cycle
    new_cycle = Cycle.objects.filter(workspace__slug=slug, project_id=project_id, pk=new_cycle_id).first()

    # Check if new cycle is already completed
    if new_cycle.end_date is not None and new_cycle.end_date < timezone.now():
        return {
            "success": False,
            "error": "The cycle where the issues are transferred is already completed",
        }

    # Get the old cycle with issue counts
    old_cycle = (
        Cycle.objects.filter(workspace__slug=slug, project_id=project_id, pk=cycle_id)
        .annotate(
            total_issues=Count(
                "issue_cycle",
                filter=Q(
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__deleted_at__isnull=True,
                    issue_cycle__issue__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            completed_issues=Count(
                "issue_cycle__issue__state__group",
                filter=Q(
                    issue_cycle__issue__state__group="completed",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            cancelled_issues=Count(
                "issue_cycle__issue__state__group",
                filter=Q(
                    issue_cycle__issue__state__group="cancelled",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            started_issues=Count(
                "issue_cycle__issue__state__group",
                filter=Q(
                    issue_cycle__issue__state__group="started",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            unstarted_issues=Count(
                "issue_cycle__issue__state__group",
                filter=Q(
                    issue_cycle__issue__state__group="unstarted",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
        .annotate(
            backlog_issues=Count(
                "issue_cycle__issue__state__group",
                filter=Q(
                    issue_cycle__issue__state__group="backlog",
                    issue_cycle__issue__archived_at__isnull=True,
                    issue_cycle__issue__is_draft=False,
                    issue_cycle__issue__deleted_at__isnull=True,
                    issue_cycle__deleted_at__isnull=True,
                ),
            )
        )
    )
    old_cycle = old_cycle.first()

    if old_cycle is None:
        return {
            "success": False,
            "error": "Source cycle not found",
        }

    # Check if project uses estimates
    estimate_type = Project.objects.filter(
        workspace__slug=slug,
        pk=project_id,
        estimate__isnull=False,
        estimate__type="points",
    ).exists()

    # Initialize estimate distribution variables
    assignee_estimate_distribution = []
    label_estimate_distribution = []
    estimate_completion_chart = {}

    if estimate_type:
        assignee_estimate_data = (
            Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(display_name=F("assignees__display_name"))
            .annotate(assignee_id=F("assignees__id"))
            .annotate(
                avatar_url=Case(
                    # If `avatar_asset` exists, use it to generate the asset URL
                    When(
                        assignees__avatar_asset__isnull=False,
                        then=Concat(
                            Value("/api/assets/v2/static/"),
                            "assignees__avatar_asset",
                            Value("/"),
                        ),
                    ),
                    # If `avatar_asset` is None, fall back to using `avatar` field directly
                    When(
                        assignees__avatar_asset__isnull=True,
                        then="assignees__avatar",
                    ),
                    default=Value(None),
                    output_field=models.CharField(),
                )
            )
            .values("display_name", "assignee_id", "avatar_url")
            .annotate(total_estimates=Sum(Cast("estimate_point__value", FloatField())))
            .annotate(
                completed_estimates=Sum(
                    Cast("estimate_point__value", FloatField()),
                    filter=Q(
                        completed_at__isnull=False,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .annotate(
                pending_estimates=Sum(
                    Cast("estimate_point__value", FloatField()),
                    filter=Q(
                        completed_at__isnull=True,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .order_by("display_name")
        )
        # Assignee estimate distribution serialization
        assignee_estimate_distribution = [
            {
                "display_name": item["display_name"],
                "assignee_id": (str(item["assignee_id"]) if item["assignee_id"] else None),
                "avatar_url": item.get("avatar_url"),
                "total_estimates": item["total_estimates"],
                "completed_estimates": item["completed_estimates"],
                "pending_estimates": item["pending_estimates"],
            }
            for item in assignee_estimate_data
        ]

        label_distribution_data = (
            Issue.issue_objects.filter(
                issue_cycle__cycle_id=cycle_id,
                issue_cycle__deleted_at__isnull=True,
                workspace__slug=slug,
                project_id=project_id,
            )
            .annotate(label_name=F("labels__name"))
            .annotate(color=F("labels__color"))
            .annotate(label_id=F("labels__id"))
            .values("label_name", "color", "label_id")
            .annotate(total_estimates=Sum(Cast("estimate_point__value", FloatField())))
            .annotate(
                completed_estimates=Sum(
                    Cast("estimate_point__value", FloatField()),
                    filter=Q(
                        completed_at__isnull=False,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .annotate(
                pending_estimates=Sum(
                    Cast("estimate_point__value", FloatField()),
                    filter=Q(
                        completed_at__isnull=True,
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
            )
            .order_by("label_name")
        )

        estimate_completion_chart = burndown_plot(
            queryset=old_cycle,
            slug=slug,
            project_id=project_id,
            plot_type="points",
            cycle_id=cycle_id,
        )
        # Label estimate distribution serialization
        label_estimate_distribution = [
            {
                "label_name": item["label_name"],
                "color": item["color"],
                "label_id": (str(item["label_id"]) if item["label_id"] else None),
                "total_estimates": item["total_estimates"],
                "completed_estimates": item["completed_estimates"],
                "pending_estimates": item["pending_estimates"],
            }
            for item in label_distribution_data
        ]

    # Get the assignee distribution
    assignee_distribution = (
        Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            issue_cycle__deleted_at__isnull=True,
            workspace__slug=slug,
            project_id=project_id,
        )
        .annotate(display_name=F("assignees__display_name"))
        .annotate(assignee_id=F("assignees__id"))
        .annotate(
            avatar_url=Case(
                # If `avatar_asset` exists, use it to generate the asset URL
                When(
                    assignees__avatar_asset__isnull=False,
                    then=Concat(
                        Value("/api/assets/v2/static/"),
                        "assignees__avatar_asset",
                        Value("/"),
                    ),
                ),
                # If `avatar_asset` is None, fall back to using `avatar` field directly
                When(assignees__avatar_asset__isnull=True, then="assignees__avatar"),
                default=Value(None),
                output_field=models.CharField(),
            )
        )
        .values("display_name", "assignee_id", "avatar_url")
        .annotate(total_issues=Count("id", filter=Q(archived_at__isnull=True, is_draft=False)))
        .annotate(
            completed_issues=Count(
                "id",
                filter=Q(
                    completed_at__isnull=False,
                    archived_at__isnull=True,
                    is_draft=False,
                ),
            )
        )
        .annotate(
            pending_issues=Count(
                "id",
                filter=Q(
                    completed_at__isnull=True,
                    archived_at__isnull=True,
                    is_draft=False,
                ),
            )
        )
        .order_by("display_name")
    )
    # Assignee distribution serialized
    assignee_distribution_data = [
        {
            "display_name": item["display_name"],
            "assignee_id": (str(item["assignee_id"]) if item["assignee_id"] else None),
            "avatar_url": item.get("avatar_url"),
            "total_issues": item["total_issues"],
            "completed_issues": item["completed_issues"],
            "pending_issues": item["pending_issues"],
        }
        for item in assignee_distribution
    ]

    # Get the label distribution
    label_distribution = (
        Issue.issue_objects.filter(
            issue_cycle__cycle_id=cycle_id,
            issue_cycle__deleted_at__isnull=True,
            workspace__slug=slug,
            project_id=project_id,
        )
        .annotate(label_name=F("labels__name"))
        .annotate(color=F("labels__color"))
        .annotate(label_id=F("labels__id"))
        .values("label_name", "color", "label_id")
        .annotate(total_issues=Count("id", filter=Q(archived_at__isnull=True, is_draft=False)))
        .annotate(
            completed_issues=Count(
                "id",
                filter=Q(
                    completed_at__isnull=False,
                    archived_at__isnull=True,
                    is_draft=False,
                ),
            )
        )
        .annotate(
            pending_issues=Count(
                "id",
                filter=Q(
                    completed_at__isnull=True,
                    archived_at__isnull=True,
                    is_draft=False,
                ),
            )
        )
        .order_by("label_name")
    )

    # Label distribution serialization
    label_distribution_data = [
        {
            "label_name": item["label_name"],
            "color": item["color"],
            "label_id": (str(item["label_id"]) if item["label_id"] else None),
            "total_issues": item["total_issues"],
            "completed_issues": item["completed_issues"],
            "pending_issues": item["pending_issues"],
        }
        for item in label_distribution
    ]

    # Generate completion chart
    completion_chart = burndown_plot(
        queryset=old_cycle,
        slug=slug,
        project_id=project_id,
        plot_type="issues",
        cycle_id=cycle_id,
    )

    # Get the current cycle and save progress snapshot
    current_cycle = Cycle.objects.filter(workspace__slug=slug, project_id=project_id, pk=cycle_id).first()

    current_cycle.progress_snapshot = {
        "total_issues": old_cycle.total_issues,
        "completed_issues": old_cycle.completed_issues,
        "cancelled_issues": old_cycle.cancelled_issues,
        "started_issues": old_cycle.started_issues,
        "unstarted_issues": old_cycle.unstarted_issues,
        "backlog_issues": old_cycle.backlog_issues,
        "distribution": {
            "labels": label_distribution_data,
            "assignees": assignee_distribution_data,
            "completion_chart": completion_chart,
        },
        "estimate_distribution": (
            {}
            if not estimate_type
            else {
                "labels": label_estimate_distribution,
                "assignees": assignee_estimate_distribution,
                "completion_chart": estimate_completion_chart,
            }
        ),
    }
    current_cycle.save(update_fields=["progress_snapshot"])

    # Get issues to transfer (only incomplete issues)
    cycle_issues = CycleIssue.objects.filter(
        cycle_id=cycle_id,
        project_id=project_id,
        workspace__slug=slug,
        issue__archived_at__isnull=True,
        issue__is_draft=False,
        issue__state__group__in=["backlog", "unstarted", "started"],
    )

    updated_cycles = []
    update_cycle_issue_activity = []
    for cycle_issue in cycle_issues:
        cycle_issue.cycle_id = new_cycle_id
        updated_cycles.append(cycle_issue)
        update_cycle_issue_activity.append(
            {
                "old_cycle_id": str(cycle_id),
                "new_cycle_id": str(new_cycle_id),
                "issue_id": str(cycle_issue.issue_id),
            }
        )

    # Bulk update cycle issues
    cycle_issues = CycleIssue.objects.bulk_update(updated_cycles, ["cycle_id"], batch_size=100)

    # Capture Issue Activity
    issue_activity.delay(
        type="cycle.activity.created",
        requested_data=json.dumps({"cycles_list": []}),
        actor_id=str(user_id),
        issue_id=None,
        project_id=str(project_id),
        current_instance=json.dumps(
            {
                "updated_cycle_issues": update_cycle_issue_activity,
                "created_cycle_issues": [],
            }
        ),
        epoch=int(timezone.now().timestamp()),
        notification=True,
        origin=base_host(request=request, is_app=True),
    )

    return {"success": True}
