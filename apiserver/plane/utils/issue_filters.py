from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime


def filter_state(params, filter, method):
    if method == "GET":
        if len(params.getlist("state")):
            filter["state__in"] = params.getlist("state")
    else:
        if len(params.get("state")):
            filter["state__in"] = params.get("state")
    return filter


def filter_priority(params, filter, method):
    if method == "GET":
        if len(params.getlist("priority")):
            filter["priority__in"] = params.getlist("priority")
    else:
        if len(params.get("priority")):
            filter["priority__in"] = params.get("priority")
    return filter


def filter_parent(params, filter, method):
    if method == "GET":
        if len(params.getlist("parent")):
            filter["parent__in"] = params.getlist("parent")
    else:
        if len(params.get("parent")):
            filter["parent__in"] = params.get("parent")
    return filter


def filter_labels(params, filter, method):
    if method == "GET":
        if len(params.getlist("labels")):
            filter["labels__in"] = params.getlist("labels")
    else:
        if len(params.get("labels")):
            filter["labels__in"] = params.get("labels")
    return filter


def filter_assignees(params, filter, method):
    if method == "GET":
        if len(params.getlist("assignees")):
            filter["assignees__in"] = params.getlist("assignees")
    else:
        if len(params.get("assignees")):
            filter["assignees__in"] = params.get("assignees")
    return filter


def filter_created_by(params, filter, method):
    if method == "GET":
        if len(params.getlist("created_by")):
            filter["created_by__in"] = params.getlist("created_by")
    else:
        if len(params.get("created_by")):
            filter["created_by__in"] = params.get("created_by")
    return filter


def filter_name(params, filter, method):
    if params.get("name", "") != "":
        filter["name__icontains"] = params.get("name")
    return filter


def filter_created_at(params, filter, method):
    if method == "GET":
        if len(params.getlist("created_at")):
            for query in params.getlist("created_at"):
                created_at_query = query.split(",")
                if len(created_at_query) == 2 and "after" in created_at_query:
                    filter["created_at__date__gte"] = created_at_query[0]
                else:
                    filter["created_at__date__lte"] = created_at_query[0]
    else:
        if len(params.get("created_at")):
            for query in params.get("created_at"):
                if query.get("timeline", "after") == "after":
                    filter["created_at__date__gte"] = query.get("datetime")
                else:
                    filter["created_at__date__lte"] = query.get("datetime")
    return filter


def filter_updated_at(params, filter, method):
    if method == "GET":
        if len(params.getlist("updated_at")):
            for query in params.getlist("updated_at"):
                updated_at_query = query.split(",")
                if len(updated_at_query) == 2 and "after" in updated_at_query:
                    filter["updated_at__date__gte"] = updated_at_query[0]
                else:
                    filter["updated_at__date__lte"] = updated_at_query[0]
    else:
        if len(params.get("updated_at")):
            for query in params.get("updated_at"):
                if query.get("timeline", "after") == "after":
                    filter["updated_at__date__gte"] = query.get("datetime")
                else:
                    filter["updated_at__date__lte"] = query.get("datetime")
    return filter


def filter_start_date(params, filter, method):
    if method == "GET":
        if len(params.getlist("start_date")):
            for query in params.getlist("start_date"):
                start_date_query = query.split(",")
                if len(start_date_query) == 2 and "after" in start_date_query:
                    filter["start_date__date__gte"] = start_date_query[0]
                else:
                    filter["start_date__date__lte"] = start_date_query[0]
    else:
        if len(params.get("start_date")):
            for query in params.get("start_date"):
                if query.get("timeline", "after") == "after":
                    filter["start_date__date__gte"] = query.get("datetime")
                else:
                    filter["start_date__date__lte"] = query.get("datetime")
    return filter


def filter_target_date(params, filter, method):
    if method == "GET":
        if len(params.getlist("target_date")):
            for query in params.getlist("target_date"):
                target_date_query = query.split(",")
                if len(target_date_query) == 2 and "after" in target_date_query:
                    filter["target_date__date__gte"] = target_date_query[0]
                else:
                    filter["target_date__date__lte"] = target_date_query[0]
    else:
        if len(params.get("target_date")):
            for query in params.get("target_date"):
                if query.get("timeline", "after") == "after":
                    filter["target_date__date__gte"] = query.get("datetime")
                else:
                    filter["target_date__date__lte"] = query.get("datetime")

    return filter


def filter_completed_at(params, filter, method):
    if method == "GET":
        if len(params.getlist("completed_at")):
            for query in params.getlist("completed_at"):
                completed_at_query = query.split(",")
                if len(completed_at_query) == 2 and "after" in completed_at_query:
                    filter["completed_at__date__gte"] = completed_at_query[0]
                else:
                    filter["completed_at__lte"] = completed_at_query[0]
    else:
        if len(params.get("completed_at")):
            for query in params.get("completed_at"):
                if query.get("timeline", "after") == "after":
                    filter["completed_at__date__gte"] = query.get("datetime")
                else:
                    filter["completed_at__lte"] = query.get("datetime")
    return filter


def filter_issue_state_type(params, filter, method):
    type = params.get("type", "all")
    group = ["backlog", "unstarted", "started", "completed", "cancelled"]
    if type == "backlog":
        group = ["backlog"]
    if type == "active":
        group = ["unstarted", "started"]

    filter["state__group__in"] = group
    return filter


def issue_filters(query_params, method):
    filter = dict()

    ISSUE_FILTER = {
        "state": filter_state,
        "priority": filter_priority,
        "parent": filter_parent,
        "labels": filter_labels,
        "assignees": filter_assignees,
        "created_by": filter_created_by,
        "name": filter_name,
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
            func(query_params, filter, method)

    return filter
