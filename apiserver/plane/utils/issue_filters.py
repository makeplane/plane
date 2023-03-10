from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime


def filter_state(params, filter):
    filter["state__in"] = params.getlist("state")
    return filter


def filter_priority(params, filter):
    filter["priority__in"] = params.getlist("priority")
    return filter


def filter_parent(params, filter):
    filter["parent__in"] = params.getlist("parent")
    return filter


def filter_labels(params, filter):
    filter["labels__in"] = params.getlist("labels")
    return filter


def filter_assignees(params, filter):
    filter["assignees__in"] = params.getlist("assignees")
    return filter


def filter_created_by(params, filter):
    filter["created_by__in"] = params.getlist("created_by")
    return filter


def filter_content(params, filter):
    filter["description_html__in"] = params.get("description_html")
    return filter


def filter_created_at(params, filter):
    for query in params.getlist("created_at"):
        created_at_query = query.split("|")
        if len(created_at_query) == 2 and "after" in created_at_query:
            filter["created_at__gte"] = make_aware(parse_datetime(created_at_query[0]))
        else:
            filter["created_at__lte"] = make_aware(parse_datetime(created_at_query[0]))

    return filter


def filter_updated_at(params, filter):
    for query in params.getlist("updated_at"):
        updated_at_query = query.split("|")
        if len(updated_at_query) == 2 and "after" in updated_at_query:
            filter["updated_at__gte"] = make_aware(parse_datetime(updated_at_query[0]))
        else:
            filter["updated_at__lte"] = make_aware(parse_datetime(updated_at_query[0]))
    return filter


def filter_start_date(params, filter):
    for query in params.getlist("start_date"):
        start_date_query = query.split("|")
        if len(start_date_query) == 2 and "after" in start_date_query:
            filter["start_date__gte"] = make_aware(parse_datetime(start_date_query[0]))
        else:
            filter["start_date__lte"] = make_aware(parse_datetime(start_date_query[0]))
    return filter


def filter_target_date(params, filter):
    for query in params.getlist("target_date"):
        target_date_query = query.split("|")
        if len(target_date_query) == 2 and "after" in target_date_query:
            filter["target_date__gte"] = make_aware(
                parse_datetime(target_date_query[0])
            )
        else:
            filter["target_date__lte"] = make_aware(
                parse_datetime(target_date_query[0])
            )


def filter_completed_at(params, filter):
    for query in params.getlist("completed_at"):
        completed_at_query = query.split("|")
        if len(completed_at_query) == 2 and "after" in completed_at_query:
            filter["completed_at__gte"] = make_aware(
                parse_datetime(completed_at_query[0])
            )
        else:
            filter["completed_at__lte"] = make_aware(
                parse_datetime(completed_at_query[0])
            )


def filter_issue_state_type(params, filter):
    type = params.get("type", "all")
    group = ["backlog", "unstarted", "started", "completed", "cancelled"]
    if type == "backlog":
        group = ["backlog"]
    if type == "active":
        group = ["unstarted", "started"]

    filter["state__group__in"] = group


def issue_filters(query_params):
    filter = dict()

    ISSUE_FILTER = {
        "state": filter_state,
        "priority": filter_priority,
        "parent": filter_parent,
        "labels": filter_labels,
        "assignees": filter_assignees,
        "created_by": filter_created_by,
        "content": filter_content,
        "created_at": filter_created_at,
        "updated_at": filter_updated_at,
        "start_date": filter_start_date,
        "target_date": filter_target_date,
        "completed_at": filter_completed_at,
        "type": filter_issue_state_type,
    }

    for key, value in ISSUE_FILTER.items():
        if key in query_params:
            func = value
            func(query_params, filter)

    return filter
