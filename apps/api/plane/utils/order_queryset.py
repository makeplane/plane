from django.db.models import Case, CharField, Min, Value, When

# Custom ordering for priority and state
PRIORITY_ORDER = ["urgent", "high", "medium", "low", "none"]
STATE_ORDER = ["backlog", "unstarted", "started", "completed", "cancelled"]


def order_issue_queryset(issue_queryset, order_by_param="-created_at"):
    # Priority Ordering
    if order_by_param == "priority" or order_by_param == "-priority":
        issue_queryset = issue_queryset.annotate(
            priority_order=Case(
                *[When(priority=p, then=Value(i)) for i, p in enumerate(PRIORITY_ORDER)],
                output_field=CharField(),
            )
        ).order_by("priority_order", "-created_at")
        order_by_param = "priority_order" if order_by_param.startswith("-") else "-priority_order"
    # State Ordering
    elif order_by_param in ["state__group", "-state__group"]:
        state_order = STATE_ORDER if order_by_param in ["state__name", "state__group"] else STATE_ORDER[::-1]
        issue_queryset = issue_queryset.annotate(
            state_order=Case(
                *[When(state__group=state_group, then=Value(i)) for i, state_group in enumerate(state_order)],
                default=Value(len(state_order)),
                output_field=CharField(),
            )
        ).order_by("state_order", "-created_at")
        order_by_param = "-state_order" if order_by_param.startswith("-") else "state_order"
    # assignee and label ordering
    elif order_by_param in [
        "labels__name",
        "assignees__first_name",
        "issue_module__module__name",
        "-labels__name",
        "-assignees__first_name",
        "-issue_module__module__name",
    ]:
        issue_queryset = issue_queryset.annotate(
            min_values=Min(order_by_param[1::] if order_by_param.startswith("-") else order_by_param)
        ).order_by(
            "-min_values" if order_by_param.startswith("-") else "min_values",
            "-created_at",
        )
        order_by_param = "-min_values" if order_by_param.startswith("-") else "min_values"
    else:
        # If the order_by_param is created_at, then don't add the -created_at
        if "created_at" in order_by_param:
            issue_queryset = issue_queryset.order_by(order_by_param)
        else:
            issue_queryset = issue_queryset.order_by(order_by_param, "-created_at")
        order_by_param = order_by_param
    return issue_queryset, order_by_param
