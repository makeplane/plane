from django.utils.timezone import make_aware
from django.utils.dateparse import parse_datetime


def issue_filters(query_params):
    filter = dict()

    if len(query_params.getlist("state")):
        filter["state__in"] = query_params.getlist("state")
    if len(query_params.getlist("priority")):
        filter["priority__in"] = query_params.getlist("priority")
    if len(query_params.getlist("parent")):
        filter["parent__in"] = query_params.getlist("parent")
    if len(query_params.getlist("labels")):
        filter["labels__in"] = query_params.getlist("labels")
    if len(query_params.getlist("assignees")):
        filter["assignees__in"] = query_params.getlist("assignees")
    if len(query_params.getlist("created_by")):
        filter["created_by__in"] = query_params.getlist("created_by")
    if query_params.get("content", False):
        filter["description_html__in"] = query_params.get("description_html")
    if len(query_params.getlist("created_at")):
        for query in query_params.getlist("created_at"):
            created_at_query = query.split(";")
            if len(created_at_query) == 2 and "after" in created_at_query:
                filter["created_at__gte"] = make_aware(
                    parse_datetime(created_at_query[0])
                )
            else:
                filter["created_at__lte"] = make_aware(
                    parse_datetime(created_at_query[0])
                )
    if len(query_params.getlist("updated_at")):
        for query in query_params.getlist("updated_at"):
            updated_at_query = query.split(";")
            if len(updated_at_query) == 2 and "after" in updated_at_query:
                filter["updated_at__gte"] = make_aware(
                    parse_datetime(updated_at_query[0])
                )
            else:
                filter["updated_at__lte"] = make_aware(
                    parse_datetime(updated_at_query[0])
                )
    if len(query_params.getlist("start_date")):
        for query in query_params.getlist("start_date"):
            start_date_query = query.split(";")
            if len(start_date_query) == 2 and "after" in start_date_query:
                filter["start_date__gte"] = make_aware(
                    parse_datetime(start_date_query[0])
                )
            else:
                filter["start_date__gte"] = make_aware(
                    parse_datetime(start_date_query[0])
                )

    if len(query_params.getlist("target_date")):
        for query in query_params.getlist("target_date"):
            target_date_query = query.split(";")
            if len(target_date_query) == 2 and "after" in target_date_query:
                filter["target_date__gte"] = make_aware(
                    parse_datetime(target_date_query[0])
                )
            else:
                filter["target_date__gte"] = make_aware(
                    parse_datetime(target_date_query[0])
                )

    if len(query_params.getlist("completed_at")):
        for query in query_params.getlist("completed_at"):
            completed_at_query = query.split(";")
            if len(completed_at_query) == 2 and "after" in completed_at_query:
                filter["completed_at__gte"] = make_aware(
                    parse_datetime(completed_at_query[0])
                )
            else:
                filter["completed_at__gte"] = make_aware(
                    parse_datetime(completed_at_query[0])
                )

    return filter
