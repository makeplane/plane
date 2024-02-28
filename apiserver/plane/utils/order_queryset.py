from django.db.models import (
    Case,
    Value,
    CharField,
    When,
    Max,
)

# Custom ordering for priority and state
PRIORITY_ORDER = ["urgent", "high", "medium", "low", "none"]
STATE_ORDER = [
    "backlog",
    "unstarted",
    "started",
    "completed",
    "cancelled",
]


def order_issue_queryset(issue_queryset, order_by_param="created_at"):
    # Priority Ordering
    if order_by_param == "priority" or order_by_param == "-priority":
        priority_order = (
            PRIORITY_ORDER
            if order_by_param == "priority"
            else PRIORITY_ORDER[::-1]
        )
        issue_queryset = issue_queryset.annotate(
            priority_order=Case(
                *[
                    When(priority=p, then=Value(i))
                    for i, p in enumerate(priority_order)
                ],
                output_field=CharField(),
            )
        ).order_by("priority_order")

    # State Ordering
    elif order_by_param in [
        "state__name",
        "state__group",
        "-state__name",
        "-state__group",
    ]:
        state_order = (
            STATE_ORDER
            if order_by_param in ["state__name", "state__group"]
            else STATE_ORDER[::-1]
        )
        issue_queryset = issue_queryset.annotate(
            state_order=Case(
                *[
                    When(state__group=state_group, then=Value(i))
                    for i, state_group in enumerate(state_order)
                ],
                default=Value(len(state_order)),
                output_field=CharField(),
            )
        ).order_by("state_order")
    # assignee and label ordering
    elif order_by_param in [
        "labels__name",
        "-labels__name",
        "assignees__first_name",
        "-assignees__first_name",
    ]:
        issue_queryset = issue_queryset.annotate(
            max_values=Max(
                order_by_param[1::]
                if order_by_param.startswith("-")
                else order_by_param
            )
        ).order_by(
            "-max_values" if order_by_param.startswith("-") else "max_values"
        )
    else:
        issue_queryset = issue_queryset.order_by(order_by_param)

    return issue_queryset
