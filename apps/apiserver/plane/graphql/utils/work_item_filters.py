# Python Imports
import re
import uuid
from datetime import timedelta

# Django Imports
from django.utils import timezone

# Module Imports
from plane.db.models.issue import IssueRelation

# The date from pattern
pattern = re.compile(r"\d+_(weeks|months)$")


# check the valid uuids
def filter_valid_uuids(uuid_list):
    valid_uuids = []
    for uuid_str in uuid_list:
        try:
            uuid_obj = uuid.UUID(uuid_str)
            valid_uuids.append(uuid_obj)
        except ValueError:
            # ignore the invalid uuids
            pass
    return valid_uuids


# Get the 2_weeks, 3_months
def string_date_filter(
    work_item_filter, duration, subsequent, term, date_filter, offset
):
    now = timezone.now().date()
    if term == "months":
        if subsequent == "after":
            if offset == "fromnow":
                work_item_filter[f"{date_filter}__gte"] = now + timedelta(
                    days=duration * 30
                )
            else:
                work_item_filter[f"{date_filter}__gte"] = now - timedelta(
                    days=duration * 30
                )
        else:
            if offset == "fromnow":
                work_item_filter[f"{date_filter}__lte"] = now + timedelta(
                    days=duration * 30
                )
            else:
                work_item_filter[f"{date_filter}__lte"] = now - timedelta(
                    days=duration * 30
                )
    if term == "weeks":
        if subsequent == "after":
            if offset == "fromnow":
                work_item_filter[f"{date_filter}__gte"] = now + timedelta(
                    weeks=duration
                )
            else:
                work_item_filter[f"{date_filter}__gte"] = now - timedelta(
                    weeks=duration
                )
        else:
            if offset == "fromnow":
                work_item_filter[f"{date_filter}__lte"] = now + timedelta(
                    weeks=duration
                )
            else:
                work_item_filter[f"{date_filter}__lte"] = now - timedelta(
                    weeks=duration
                )


def date_filter(work_item_filter, date_term, queries):
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
                            work_item_filter=work_item_filter,
                            duration=int(digit),
                            subsequent=date_query[1],
                            term=term,
                            date_filter=date_term,
                            offset=date_query[2],
                        )
                else:
                    if "after" in date_query:
                        work_item_filter[f"{date_term}__gte"] = date_query[0]
                    else:
                        work_item_filter[f"{date_term}__lte"] = date_query[0]
            else:
                work_item_filter[f"{date_term}__contains"] = date_query[0]


def filter_state(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}state__in"] = param_values

    return work_item_filter


def filter_state_group(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}state__group__in"] = param_values

    return work_item_filter


def filter_priority(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}priority__in"] = param_values

    return work_item_filter


def filter_labels(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}label_issue__label__in"] = param_values
    work_item_filter[f"{prefix}label_issue__deleted_at__isnull"] = True

    return work_item_filter


def filter_assignees(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}issue_assignee__deleted_at__isnull"] = True
    work_item_filter[f"{prefix}issue_assignee__assignee__in"] = param_values

    return work_item_filter


def filter_created_by(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}created_by__in"] = param_values

    return work_item_filter


def filter_subscribed_issues(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}issue_subscribers__subscriber_id__in"] = param_values

    return work_item_filter


def filter_start_date(param_values, work_item_filter, prefix=""):
    date_filter(
        work_item_filter=work_item_filter,
        date_term=f"{prefix}start_date",
        queries=param_values,
    )

    return work_item_filter


def filter_target_date(param_values, work_item_filter, prefix=""):
    date_filter(
        work_item_filter=work_item_filter,
        date_term=f"{prefix}target_date",
        queries=param_values,
    )

    return work_item_filter


def filter_estimate_point(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}estimate_point__in"] = param_values

    return work_item_filter


def filter_parent(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}parent__in"] = param_values

    return work_item_filter


def filter_mentions(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}issue_mention__mention__id__in"] = param_values

    return work_item_filter


def filter_name(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}name__icontains"] = param_values

    return work_item_filter


def filter_created_at(param_values, work_item_filter, prefix=""):
    date_filter(
        work_item_filter=work_item_filter,
        date_term=f"{prefix}created_at__date",
        queries=param_values,
    )

    return work_item_filter


def filter_updated_at(param_values, work_item_filter, prefix=""):
    date_filter(
        work_item_filter=work_item_filter,
        date_term=f"{prefix}updated_at__date",
        queries=param_values,
    )

    return work_item_filter


def filter_completed_at(param_values, work_item_filter, prefix=""):
    date_filter(
        work_item_filter=work_item_filter,
        date_term=f"{prefix}completed_at__date",
        queries=param_values,
    )

    return work_item_filter


def filter_issue_state_type(param_values, work_item_filter, prefix=""):
    type = param_values
    group = ["backlog", "unstarted", "started", "completed", "cancelled"]
    if type == "backlog":
        group = ["backlog"]
    if type == "active":
        group = ["unstarted", "started"]

    work_item_filter[f"{prefix}state__group__in"] = group

    return work_item_filter


def filter_project(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}project__in"] = param_values

    return work_item_filter


def filter_cycle(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}issue_cycle__cycle_id__in"] = param_values
    work_item_filter[f"{prefix}issue_cycle__deleted_at__isnull"] = True

    return work_item_filter


def filter_module(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}issue_module__module_id__in"] = param_values
    work_item_filter[f"{prefix}issue_module__deleted_at__isnull"] = True

    return work_item_filter


def filter_intake_status(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}issue_intake__status__in"] = param_values

    return work_item_filter


def filter_inbox_status(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}issue_intake__status__in"] = param_values

    return work_item_filter


def filter_sub_issue_toggle(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}parent__isnull"] = param_values

    return work_item_filter


def filter_start_target_date_issues(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}target_date__isnull"] = False
    work_item_filter[f"{prefix}start_date__isnull"] = False

    return work_item_filter


def filter_logged_by(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}logged_by__in"] = param_values

    return work_item_filter


def filter_issue_type(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}type__in"] = param_values

    return work_item_filter


def filter_team_project(param_values, work_item_filter, prefix=""):
    work_item_filter[f"{prefix}project__in"] = param_values

    return work_item_filter


def filter_dependencies(param_values, work_item_filter, prefix=""):
    dependency_type = param_values or "all"

    if dependency_type == "blocking":
        issue_ids = IssueRelation.objects.filter(
            relation_type="blocked_by"
        ).values_list("issue_id", flat=True)
        work_item_filter[f"{prefix}id__in"] = issue_ids

    if dependency_type == "blocked_by":
        issue_ids = IssueRelation.objects.filter(
            relation_type="blocked_by"
        ).values_list("related_issue_id", flat=True)
        work_item_filter[f"{prefix}id__in"] = issue_ids

    return work_item_filter


def work_item_filters(query_params, prefix=""):
    work_item_filter = {}

    WORK_ITEM_FILTER_MAP = {
        "state": filter_state,
        "state_group": filter_state_group,
        "priority": filter_priority,
        "labels": filter_labels,
        "assignees": filter_assignees,
        "created_by": filter_created_by,
        "subscriber": filter_subscribed_issues,
        "start_date": filter_start_date,
        "target_date": filter_target_date,
        # upcoming filters
        "cycle": filter_cycle,
        "module": filter_module,
        "estimate_point": filter_estimate_point,
        "parent": filter_parent,
        "mentions": filter_mentions,
        "logged_by": filter_logged_by,
        "name": filter_name,
        "created_at": filter_created_at,
        "updated_at": filter_updated_at,
        "completed_at": filter_completed_at,
        "type": filter_issue_state_type,
        "project": filter_project,
        "intake_status": filter_intake_status,
        "inbox_status": filter_inbox_status,
        "sub_issue": filter_sub_issue_toggle,
        "start_target_date": filter_start_target_date_issues,
        "issue_type": filter_issue_type,
        "team_project": filter_team_project,
        "dependency_type": filter_dependencies,
    }

    # check if query params is empty
    if not query_params:
        return work_item_filter

    for key, value in query_params.items():
        if value is not None and len(value) > 0:
            func = WORK_ITEM_FILTER_MAP[key]
            func(value, work_item_filter, prefix)

    return work_item_filter
