# Python Imports
import re
from dateutil.relativedelta import relativedelta

# Django Imports
from django.utils import timezone

# The date from pattern
pattern = re.compile(r"\d+_(weeks|months)$")


# Get the 2_weeks, 3_months
def string_date_filter(
    intake_work_item_filter, duration, subsequent, term, date_filter, offset
):
    now = timezone.now().date()
    if term == "months":
        if subsequent == "after":
            if offset == "fromnow":
                intake_work_item_filter[f"{date_filter}__gte"] = now + relativedelta(
                    months=duration
                )
            else:
                intake_work_item_filter[f"{date_filter}__gte"] = now - relativedelta(
                    months=duration
                )
        else:
            if offset == "fromnow":
                intake_work_item_filter[f"{date_filter}__lte"] = now + relativedelta(
                    months=duration
                )
            else:
                intake_work_item_filter[f"{date_filter}__lte"] = now - relativedelta(
                    months=duration
                )
    if term == "weeks":
        if subsequent == "after":
            if offset == "fromnow":
                intake_work_item_filter[f"{date_filter}__gte"] = now + relativedelta(
                    weeks=duration
                )
            else:
                intake_work_item_filter[f"{date_filter}__gte"] = now - relativedelta(
                    weeks=duration
                )
        else:
            if offset == "fromnow":
                intake_work_item_filter[f"{date_filter}__lte"] = now + relativedelta(
                    weeks=duration
                )
            else:
                intake_work_item_filter[f"{date_filter}__lte"] = now - relativedelta(
                    weeks=duration
                )


def date_filter(intake_work_item_filter, date_term, queries):
    """
    Handle all date filters
    """
    for query in queries:
        date_query = query.split(";")
        if date_query:
            if len(date_query) >= 2:
                match = pattern.match(date_query[0])
                if match:
                    if len(date_query) == 3:
                        digit, term = date_query[0].split("_")
                        string_date_filter(
                            intake_work_item_filter=intake_work_item_filter,
                            duration=int(digit),
                            subsequent=date_query[1],
                            term=term,
                            date_filter=date_term,
                            offset=date_query[2],
                        )
                else:
                    if "after" in date_query:
                        intake_work_item_filter[f"{date_term}__gte"] = date_query[0]
                    else:
                        intake_work_item_filter[f"{date_term}__lte"] = date_query[0]
            else:
                intake_work_item_filter[f"{date_term}__contains"] = date_query[0]


def filter_status(param_values, intake_work_item_filter, prefix=""):
    intake_work_item_filter[f"{prefix}status__in"] = param_values

    return intake_work_item_filter


def filter_state(param_values, intake_work_item_filter, prefix=""):
    intake_work_item_filter[f"{prefix}state__in"] = param_values

    return intake_work_item_filter


def filter_priority(param_values, intake_work_item_filter, prefix=""):
    intake_work_item_filter[f"{prefix}priority__in"] = param_values

    return intake_work_item_filter


def filter_assignees(param_values, intake_work_item_filter, prefix=""):
    intake_work_item_filter[f"{prefix}issue_assignee__deleted_at__isnull"] = True
    intake_work_item_filter[f"{prefix}issue_assignee__assignee__in"] = param_values

    return intake_work_item_filter


def filter_created_by(param_values, intake_work_item_filter, prefix=""):
    intake_work_item_filter[f"{prefix}created_by__in"] = param_values

    return intake_work_item_filter


def filter_labels(param_values, intake_work_item_filter, prefix=""):
    intake_work_item_filter[f"{prefix}label_issue__label__in"] = param_values
    intake_work_item_filter[f"{prefix}label_issue__deleted_at__isnull"] = True

    return intake_work_item_filter


def filter_created_at(param_values, intake_work_item_filter, prefix=""):
    date_filter(
        intake_work_item_filter=intake_work_item_filter,
        date_term=f"{prefix}created_at__date",
        queries=param_values,
    )

    return intake_work_item_filter


def filter_updated_at(param_values, intake_work_item_filter, prefix=""):
    date_filter(
        intake_work_item_filter=intake_work_item_filter,
        date_term=f"{prefix}updated_at__date",
        queries=param_values,
    )

    return intake_work_item_filter


def intake_filters(query_params, prefix="", issue_prefix="issue_intake__"):
    intake_filter = {}

    INTAKE_FILTER_MAP = {
        "status": filter_status,
        "state": filter_state,
        "priority": filter_priority,
        "assignees": filter_assignees,
        "created_by": filter_created_by,
        "labels": filter_labels,
        "created_at": filter_created_at,
        "updated_at": filter_updated_at,
    }

    # check if query params is empty
    if not query_params:
        return intake_filter

    for key, value in query_params.items():
        if value is not None and len(value) > 0:
            if key == "status":
                func = INTAKE_FILTER_MAP[key]
                func(value, intake_filter, prefix)
            else:
                func = INTAKE_FILTER_MAP[key]
                func(value, intake_filter, issue_prefix)

    return intake_filter
