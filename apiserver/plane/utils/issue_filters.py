import re
import uuid
from datetime import timedelta, datetime

from django.utils import timezone
from django.db.models import Q, OuterRef
from plane.db.models import IssueCustomProperty
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
    issue_filter, duration, subsequent, term, date_filter, offset
):
    now = timezone.now().date()
    if term == "months":
        if subsequent == "after":
            if offset == "fromnow":
                issue_filter[f"{date_filter}__gte"] = now + timedelta(
                    days=duration * 30
                )
            else:
                issue_filter[f"{date_filter}__gte"] = now - timedelta(
                    days=duration * 30
                )
        else:
            if offset == "fromnow":
                issue_filter[f"{date_filter}__lte"] = now + timedelta(
                    days=duration * 30
                )
            else:
                issue_filter[f"{date_filter}__lte"] = now - timedelta(
                    days=duration * 30
                )
    if term == "weeks":
        if subsequent == "after":
            if offset == "fromnow":
                issue_filter[f"{date_filter}__gte"] = now + timedelta(
                    weeks=duration
                )
            else:
                issue_filter[f"{date_filter}__gte"] = now - timedelta(
                    weeks=duration
                )
        else:
            if offset == "fromnow":
                issue_filter[f"{date_filter}__lte"] = now + timedelta(
                    weeks=duration
                )
            else:
                issue_filter[f"{date_filter}__lte"] = now - timedelta(
                    weeks=duration
                )


def date_filter(issue_filter, date_term, queries):
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
                            issue_filter=issue_filter,
                            duration=int(digit),
                            subsequent=date_query[1],
                            term=term,
                            date_filter=date_term,
                            offset=date_query[2],
                        )
                else:
                    if "after" in date_query:
                        issue_filter[f"{date_term}__gte"] = date_query[0]
                    else:
                        issue_filter[f"{date_term}__lte"] = date_query[0]
            else:
                issue_filter[f"{date_term}__contains"] = date_query[0]


def filter_state(params, issue_filter, method, prefix=""):
    if method == "GET":
        states = [
            item for item in params.get("state").split(",") if item != "null"
        ]
        states = filter_valid_uuids(states)
        if len(states) and "" not in states:
            issue_filter[f"{prefix}state__in"] = states
    else:
        if (
            params.get("state", None)
            and len(params.get("state"))
            and params.get("state") != "null"
        ):
            issue_filter[f"{prefix}state__in"] = params.get("state")
    return issue_filter


def filter_state_group(params, issue_filter, method, prefix=""):
    if method == "GET":
        state_group = [
            item
            for item in params.get("state_group").split(",")
            if item != "null"
        ]
        if len(state_group) and "" not in state_group:
            issue_filter[f"{prefix}state__group__in"] = state_group
    else:
        if (
            params.get("state_group", None)
            and len(params.get("state_group"))
            and params.get("state_group") != "null"
        ):
            issue_filter[f"{prefix}state__group__in"] = params.get(
                "state_group"
            )
    return issue_filter


def filter_estimate_point(params, issue_filter, method, prefix=""):
    if method == "GET":
        estimate_points = [
            item
            for item in params.get("estimate_point").split(",")
            if item != "null"
        ]
        if len(estimate_points) and "" not in estimate_points:
            issue_filter[f"{prefix}estimate_point__in"] = estimate_points
    else:
        if (
            params.get("estimate_point", None)
            and len(params.get("estimate_point"))
            and params.get("estimate_point") != "null"
        ):
            issue_filter[f"{prefix}estimate_point__in"] = params.get(
                "estimate_point"
            )
    return issue_filter


def filter_priority(params, issue_filter, method, prefix=""):
    if method == "GET":
        priorities = [
            item
            for item in params.get("priority").split(",")
            if item != "null"
        ]
        if len(priorities) and "" not in priorities:
            issue_filter[f"{prefix}priority__in"] = priorities
    else:
        if (
            params.get("priority", None)
            and len(params.get("priority"))
            and params.get("priority") != "null"
        ):
            issue_filter[f"{prefix}priority__in"] = params.get("priority")
    return issue_filter


def filter_parent(params, issue_filter, method, prefix=""):
    if method == "GET":
        parents = [
            item for item in params.get("parent").split(",") if item != "null"
        ]
        if "None" in parents:
            issue_filter[f"{prefix}parent__isnull"] = True
        parents = filter_valid_uuids(parents)
        if len(parents) and "" not in parents:
            issue_filter[f"{prefix}parent__in"] = parents
    else:
        if (
            params.get("parent", None)
            and len(params.get("parent"))
            and params.get("parent") != "null"
        ):
            issue_filter[f"{prefix}parent__in"] = params.get("parent")
    return issue_filter


def filter_labels(params, issue_filter, method, prefix=""):
    if method == "GET":
        labels = [
            item for item in params.get("labels").split(",") if item != "null"
        ]
        if "None" in labels:
            issue_filter[f"{prefix}labels__isnull"] = True
        labels = filter_valid_uuids(labels)
        if len(labels) and "" not in labels:
            issue_filter[f"{prefix}labels__in"] = labels
    else:
        if (
            params.get("labels", None)
            and len(params.get("labels"))
            and params.get("labels") != "null"
        ):
            issue_filter[f"{prefix}labels__in"] = params.get("labels")
    return issue_filter


def filter_assignees(params, issue_filter, method, prefix=""):
    if method == "GET":
        assignees = [
            item
            for item in params.get("assignees").split(",")
            if item != "null"
        ]
        if "None" in assignees:
            issue_filter[f"{prefix}assignees__isnull"] = True
        assignees = filter_valid_uuids(assignees)
        if len(assignees) and "" not in assignees:
            issue_filter[f"{prefix}assignees__in"] = assignees
    else:
        if (
            params.get("assignees", None)
            and len(params.get("assignees"))
            and params.get("assignees") != "null"
        ):
            issue_filter[f"{prefix}assignees__in"] = params.get("assignees")
    return issue_filter


def filter_mentions(params, issue_filter, method, prefix=""):
    if method == "GET":
        mentions = [
            item
            for item in params.get("mentions").split(",")
            if item != "null"
        ]
        mentions = filter_valid_uuids(mentions)
        if len(mentions) and "" not in mentions:
            issue_filter[f"{prefix}issue_mention__mention__id__in"] = mentions
    else:
        if (
            params.get("mentions", None)
            and len(params.get("mentions"))
            and params.get("mentions") != "null"
        ):
            issue_filter[f"{prefix}issue_mention__mention__id__in"] = (
                params.get("mentions")
            )
    return issue_filter


def filter_created_by(params, issue_filter, method, prefix=""):
    if method == "GET":
        created_bys = [
            item
            for item in params.get("created_by").split(",")
            if item != "null"
        ]
        if "None" in created_bys:
            issue_filter[f"{prefix}created_by__isnull"] = True
        print(created_bys)
        created_bys = filter_valid_uuids(created_bys)

        if len(created_bys) and "" not in created_bys:
            issue_filter[f"{prefix}created_by__in"] = created_bys
    else:
        if (
            params.get("created_by", None)
            and len(params.get("created_by"))
            and params.get("created_by") != "null"
        ):
            issue_filter[f"{prefix}created_by__in"] = params.get("created_by")
    return issue_filter


def filter_created_by_username(params, issue_filter, method, prefix=""):
    if method == "GET":
        created_bys = [
            item
            for item in params.get("created_by_username").split(",")
            if item != "null"
        ]
        if len(created_bys) and "" not in created_bys:
            issue_filter[f"{prefix}created_by__username__in"] = created_bys
    # else:
    #     if (
    #         params.get("created_by", None)
    #         and len(params.get("created_by"))
    #         and params.get("created_by") != "null"
    #     ):
    #         issue_filter[f"{prefix}created_by__in"] = params.get("created_by")
    return issue_filter


def filter_name(params, issue_filter, method, prefix=""):
    if params.get("name", "") != "":
        issue_filter[f"{prefix}name__icontains"] = params.get("name")
    return issue_filter


def filter_created_at(params, issue_filter, method, prefix=""):
    if method == "GET":
        created_ats = params.get("created_at").split(",")
        if len(created_ats) and "" not in created_ats:
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}created_at__date",
                queries=created_ats,
            )
    else:
        if params.get("created_at", None) and len(params.get("created_at")):
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}created_at__date",
                queries=params.get("created_at", []),
            )
    return issue_filter


def filter_updated_at(params, issue_filter, method, prefix=""):
    if method == "GET":
        updated_ats = params.get("updated_at").split(",")
        if len(updated_ats) and "" not in updated_ats:
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}created_at__date",
                queries=updated_ats,
            )
    else:
        if params.get("updated_at", None) and len(params.get("updated_at")):
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}created_at__date",
                queries=params.get("updated_at", []),
            )
    return issue_filter


def filter_start_date(params, issue_filter, method, prefix=""):
    if method == "GET":
        start_dates = params.get("start_date").split(",")
        if len(start_dates) and "" not in start_dates:
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}start_date",
                queries=start_dates,
            )
    else:
        if params.get("start_date", None) and len(params.get("start_date")):
            issue_filter[f"{prefix}start_date"] = params.get("start_date")
    return issue_filter


def filter_target_date(params, issue_filter, method, prefix=""):
    if method == "GET":
        target_dates = params.get("target_date").split(",")
        if len(target_dates) and "" not in target_dates:
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}target_date",
                queries=target_dates,
            )
    else:
        if params.get("target_date", None) and len(params.get("target_date")):
            issue_filter[f"{prefix}target_date"] = params.get("target_date")
    return issue_filter


def filter_completed_at(params, issue_filter, method, prefix=""):
    if method == "GET":
        completed_ats = params.get("completed_at").split(",")
        if len(completed_ats) and "" not in completed_ats:
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}completed_at__date",
                queries=completed_ats,
            )
    else:
        if params.get("completed_at", None) and len(
            params.get("completed_at")
        ):
            date_filter(
                issue_filter=issue_filter,
                date_term=f"{prefix}completed_at__date",
                queries=params.get("completed_at", []),
            )
    return issue_filter


def filter_issue_state_type(params, issue_filter, method, prefix=""):
    type = params.get("type", "all")
    group = ["backlog", "unstarted", "started", "completed", "cancelled"]
    if type == "backlog":
        group = ["backlog"]
    if type == "active":
        group = ["unstarted", "started"]

    issue_filter[f"{prefix}state__group__in"] = group
    return issue_filter


def filter_project(params, issue_filter, method, prefix=""):
    if method == "GET":
        projects = [
            item for item in params.get("project").split(",") if item != "null"
        ]
        projects = filter_valid_uuids(projects)
        if len(projects) and "" not in projects:
            issue_filter[f"{prefix}project__in"] = projects
    else:
        if (
            params.get("project", None)
            and len(params.get("project"))
            and params.get("project") != "null"
        ):
            issue_filter[f"{prefix}project__in"] = params.get("project")
    return issue_filter


def filter_cycle(params, issue_filter, method, prefix=""):
    if method == "GET":
        cycles = [
            item for item in params.get("cycle").split(",") if item != "null"
        ]
        if "None" in cycles:
            issue_filter[f"{prefix}issue_cycle__cycle_id__isnull"] = True
        cycles = filter_valid_uuids(cycles)
        if len(cycles) and "" not in cycles:
            issue_filter[f"{prefix}issue_cycle__cycle_id__in"] = cycles
    else:
        if (
            params.get("cycle", None)
            and len(params.get("cycle"))
            and params.get("cycle") != "null"
        ):
            issue_filter[f"{prefix}issue_cycle__cycle_id__in"] = params.get(
                "cycle"
            )
    issue_filter[f"{prefix}issue_cycle__deleted_at__isnull"] = True
    return issue_filter


def filter_module(params, issue_filter, method, prefix=""):
    if method == "GET":
        modules = [
            item for item in params.get("module").split(",") if item != "null"
        ]
        if "None" in modules:
            issue_filter[f"{prefix}issue_module__module_id__isnull"] = True
        modules = filter_valid_uuids(modules)
        if len(modules) and "" not in modules:
            issue_filter[f"{prefix}issue_module__module_id__in"] = modules
    else:
        if (
            params.get("module", None)
            and len(params.get("module"))
            and params.get("module") != "null"
        ):
            issue_filter[f"{prefix}issue_module__module_id__in"] = params.get(
                "module"
            )
    issue_filter[f"{prefix}issue_module__deleted_at__isnull"] = True
    return issue_filter


def filter_inbox_status(params, issue_filter, method, prefix=""):
    if method == "GET":
        status = [
            item
            for item in params.get("inbox_status").split(",")
            if item != "null"
        ]
        if len(status) and "" not in status:
            issue_filter[f"{prefix}issue_inbox__status__in"] = status
    else:
        if (
            params.get("inbox_status", None)
            and len(params.get("inbox_status"))
            and params.get("inbox_status") != "null"
        ):
            issue_filter[f"{prefix}issue_inbox__status__in"] = params.get(
                "inbox_status"
            )
    return issue_filter


def filter_sub_issue_toggle(params, issue_filter, method, prefix=""):
    if method == "GET":
        sub_issue = params.get("sub_issue", "false")
        if sub_issue == "false":
            issue_filter[f"{prefix}parent__isnull"] = True
    else:
        sub_issue = params.get("sub_issue", "false")
        if sub_issue == "false":
            issue_filter[f"{prefix}parent__isnull"] = True
    return issue_filter


def filter_subscribed_issues(params, issue_filter, method, prefix=""):
    if method == "GET":
        subscribers = [
            item
            for item in params.get("subscriber").split(",")
            if item != "null"
        ]
        subscribers = filter_valid_uuids(subscribers)
        if len(subscribers) and "" not in subscribers:
            issue_filter[f"{prefix}issue_subscribers__subscriber_id__in"] = (
                subscribers
            )
    else:
        if (
            params.get("subscriber", None)
            and len(params.get("subscriber"))
            and params.get("subscriber") != "null"
        ):
            issue_filter[f"{prefix}issue_subscribers__subscriber_id__in"] = (
                params.get("subscriber")
            )
    return issue_filter


def filter_start_target_date_issues(params, issue_filter, method, prefix=""):
    start_target_date = params.get("start_target_date", "false")
    if start_target_date == "true":
        issue_filter[f"{prefix}target_date__isnull"] = False
        issue_filter[f"{prefix}start_date__isnull"] = False
    return issue_filter


def filter_logged_by(params, issue_filter, method, prefix=""):
    if method == "GET":
        logged_bys = [
            item
            for item in params.get("logged_by").split(",")
            if item != "null"
        ]
        if "None" in logged_bys:
            issue_filter[f"{prefix}logged_by__isnull"] = True
        logged_bys = filter_valid_uuids(logged_bys)
        if len(logged_bys) and "" not in logged_bys:
            issue_filter[f"{prefix}logged_by__in"] = logged_bys
    else:
        if (
            params.get("logged_by", None)
            and len(params.get("logged_by"))
            and params.get("logged_by") != "null"
        ):
            issue_filter[f"{prefix}logged_by__in"] = params.get("logged_by")
    return issue_filter


def filter_custom_properties(params, issue_filter, method, prefix=""):
    if method == "GET":
        raw_props = params.get("custom_properties", "")
        
        # Check if the format uses pipes (|) for separation
        if "|" in raw_props:
            # Handle new format with pipe separator
            custom_properties = [
                item for item in raw_props.split("|") if item and item != "null"
            ]
        else:
            # Handle old format with comma separator
            custom_properties = [
                item for item in raw_props.split(",") if item and item != "null"
            ]
        
        groupedCustomProperties = {}
        for row in custom_properties:
            # Handle both simple key:value and key__operator:value formats
            if ":" in row:
                key, value = row.split(":", 1)
                if key not in groupedCustomProperties:
                    groupedCustomProperties[key] = []
                groupedCustomProperties[key].append(value)
        
        issue_filter['custom_properties'] = groupedCustomProperties
    
    return issue_filter

def filter_character_fields(params, issue_filter, method, prefix=""):
    character_fields = [
        "trip_reference_number",
        "reference_number",
        "hub_code",
        "hub_name",
        "customer_code",
        "customer_name",
        "vendor_name",
        "vendor_code",
        "worker_code",
        "worker_name",
        "source"
    ]

    for field in character_fields:
        value = params.get(field, "").strip()
        if value:
            values_list = [v.strip() for v in value.split(",") if v.strip()]
            issue_filter[f"{prefix}{field}__in"] = values_list

    return issue_filter

def build_custom_property_q_objects(custom_properties):
    custom_filters = []

    string_operator_map = {
        "contains": ("icontains", False),
        "not_contains": ("icontains", True),
        "is_equal_to": ("exact", False),
        "is_not_equal_to": ("exact", True),
        "isnull": ("isnull", False),
        "isnotnull": ("isnull", True),
    }

    for key, values in custom_properties.items():
        key_parts = key.split('__')
        actual_key = key_parts[0]
        operator = key_parts[1] if len(key_parts) > 1 else 'in'

        data_type_qs = IssueCustomProperty.objects.filter(
            key=actual_key
        ).values_list("data_type", flat=True).distinct()

        if not data_type_qs:
            continue

        data_type = data_type_qs[0]

        base_field = (
            "int_value" if data_type == "number"
            else "date_value" if data_type == "date"
            else "bool_value" if data_type == "boolean"
            else "value"
        )

        # Define base filters used across all data types
        base_filters = {
            "key": actual_key
        }

        # Boolean filters
        if data_type == "boolean":
            filter_kwargs = base_filters.copy()
            
            if operator == "is_true":
                filter_kwargs[base_field] = True
            elif operator == "is_false":
                filter_kwargs[base_field] = False
            elif operator in ["isnull", "isnotnull"]:
                filter_kwargs[f"{base_field}__isnull"] = (operator == "isnull")
            else:
                bool_values = [
                    str(v).strip().lower() in ["true", "1", "yes"]
                    for v in values
                ]
                filter_kwargs[f"{base_field}__in"] = bool_values
            
            q_object = Q(id__in=IssueCustomProperty.objects.filter(**filter_kwargs).values("issue_id"))
                
        elif data_type in ["number", "date"]:
            # Handle value conversion based on data type
            try:
                if operator == "isbetween" and len(values) == 1:
                    value_range = values[0].split("^")
                    if len(value_range) != 2:
                        continue
                    lower = int(value_range[0]) if data_type == "number" else value_range[0]
                    upper = int(value_range[1]) if data_type == "number" else value_range[1]
                elif operator in ["isnull", "isnotnull"]:
                    value_input = None
                else:
                    value_input = int(values[0]) if data_type == "number" else values[0]
            except (ValueError, TypeError):
                continue

            if operator == "isbetween":
                filter_kwargs = base_filters.copy()
                filter_kwargs[f"{base_field}__gte"] = lower
                filter_kwargs[f"{base_field}__lte"] = upper
                q_object = Q(id__in=IssueCustomProperty.objects.filter(**filter_kwargs).values("issue_id"))
            
            elif operator == "ne":
                # For not equal, we need (has property AND value != X)
                exists_filter = IssueCustomProperty.objects.filter(**base_filters).values("issue_id")
                not_equal_filter = IssueCustomProperty.objects.filter(
                    **base_filters,
                    **{f"{base_field}__exact": value_input}
                ).values("issue_id")
                
                q_object = Q(id__in=exists_filter) & ~Q(id__in=not_equal_filter)
            else:
                filter_kwargs = base_filters.copy()
                if operator in ["gte", "lte", "gt", "lt", "exact"]:
                    filter_kwargs[f"{base_field}__{operator}"] = value_input
                elif operator in ["isnull", "isnotnull"]:
                    filter_kwargs[f"{base_field}__isnull"] = (operator == "isnull")
                else:
                    try:
                        if data_type == "number":
                            # For numbers, convert to integers
                            filter_kwargs[f"{base_field}__in"] = list(map(int, values))
                        else:  # data_type == "date"
                            # For dates, use the string values directly
                            filter_kwargs[f"{base_field}__in"] = values
                    except (ValueError, TypeError):
                        # Handle case when values can't be converted
                        continue
                
                q_object = Q(id__in=IssueCustomProperty.objects.filter(**filter_kwargs).values("issue_id"))
        
        
        # String filters
        else:
            if operator == "ne":
                # For string 'not equal'
                exists_filter = IssueCustomProperty.objects.filter(**base_filters).values("issue_id")
                not_equal_filter = IssueCustomProperty.objects.filter(
                    **base_filters,
                    **{f"{base_field}__exact": values[0] if values else ""}
                ).values("issue_id")
                
                q_object = Q(id__in=exists_filter) & ~Q(id__in=not_equal_filter)
            elif operator in string_operator_map:
                lookup, negate = string_operator_map[operator]
                filter_kwargs = base_filters.copy()
                
                if lookup == "isnull":
                    filter_kwargs[f"{base_field}__isnull"] = not negate if operator == "isnull" else negate
                else:
                    filter_kwargs[f"{base_field}__{lookup}"] = values[0] if values else ""
                
                q_object = Q(id__in=IssueCustomProperty.objects.filter(**filter_kwargs).values("issue_id"))
                
                if negate:
                    # For negated operations, ensure property exists but doesn't meet condition
                    exists_filter = IssueCustomProperty.objects.filter(**base_filters).values("issue_id")
                    q_object = Q(id__in=exists_filter) & ~q_object
            else:
                filter_kwargs = base_filters.copy()
                filter_kwargs[f"{base_field}__in"] = values
                q_object = Q(id__in=IssueCustomProperty.objects.filter(**filter_kwargs).values("issue_id"))
        custom_filters.append(q_object)

    return custom_filters


def filter_sequence_id(params, issue_filter, method, prefix=""):
    """
    Filter issues by sequence_id
    """
    sequence_id = params.get(f"{prefix}sequence_id", None)
    if sequence_id is not None:
        issue_filter[f"{prefix}sequence_id"] = sequence_id
    
def filter_issue_type_id(params, issue_filter, method, prefix=""):
    """
    Filter issues by type_id
    """
    type_id = params.get(f"{prefix}type_id", None)
    if type_id is not None:
        issue_filter[f"{prefix}type_id"] = type_id


def timestamp_filter(issue_filter, field, queries):
    """
    Applies timestamp filtering on the specified field using a list of query strings.

    Each query should be in the format:
      <ISO8601_timestamp>[;operator]

    - The timestamp must be in ISO 8601 format with millisecond precision (e.g., 2024-06-01T12:00:00.000Z).
    - The operator can be one of:
         'after'  -> applies __gte (records matching field >= provided timestamp).
         'before' -> applies __lte (records matching field <= provided timestamp).
    - If no operator is provided, an exact match is used.

    Returns the modified issue_filter dictionary.
    """
    for query in queries:
        if query:
            parts = query.split(";")
            try:
                # Parse the first timestamp
                time_str = parts[0]
                iso_str = time_str.replace("Z", "+00:00")
                ts = datetime.fromisoformat(iso_str)
            except Exception:
                continue
            if len(parts) > 1:
                direction = parts[1].strip().lower()
                if direction == "after":
                    issue_filter[f"{field}__gte"] = ts
                elif direction == "before":
                    issue_filter[f"{field}__lte"] = ts
            else:
                issue_filter[f"{field}__exact"] = ts
    return issue_filter


def filter_created_at_ts(params, issue_filter, method, prefix=""):
    """
    Applies timestamp-level filtering to the created_at field based on the 'created_at_ts' parameter.

    Expected format: an ISO 8601 timestamp with millisecond precision, optionally with an operator.
    Examples:
      - '?created_at_ts=2024-06-01T12:00:00.000Z;after'
      - '?created_at_ts=2024-06-01T12:00:00.000Z;after,2024-06-01T12:15:00.000Z;before'
    
    Note: For GET requests, parameters are expected as a comma-separated string; for non-GET methods, parameter handling might differ.
    """
    if method == "GET":
        # In GET, expect query parameters as comma-separated string
        created_ts = params.get("created_at_ts")
        if created_ts:
            queries = created_ts.split(",")
            timestamp_filter(issue_filter, f"{prefix}created_at", queries)
    else:
        if params.get("created_at_ts", None):
            queries = params.get("created_at_ts")
            timestamp_filter(issue_filter, f"{prefix}created_at", queries)
    return issue_filter


def filter_updated_at_ts(params, issue_filter, method, prefix=""):
    """
    Applies timestamp-level filtering to the updated_at field based on the 'updated_at_ts' parameter.

    Expected format: an ISO 8601 timestamp with millisecond precision, optionally with an operator.
    Examples:
      - '?updated_at_ts=2024-06-01T12:00:00.000Z;before'
      - '?updated_at_ts=2024-06-01T12:00:00.000Z;after,2024-06-01T12:15:00.000Z;before'
    
    Note: Differentiation based on HTTP method is to correctly handle parameter formats between GET (query string) and non-GET (payload) requests.
    """
    if method == "GET":
        updated_ts = params.get("updated_at_ts")
        if updated_ts:
            queries = updated_ts.split(",")
            timestamp_filter(issue_filter, f"{prefix}updated_at", queries)
    else:
        if params.get("updated_at_ts", None):
            queries = params.get("updated_at_ts")
            timestamp_filter(issue_filter, f"{prefix}updated_at", queries)
    return issue_filter

def issue_filters(query_params, method, prefix=""):
    issue_filter = {}

    ISSUE_FILTER = {
        "state": filter_state,
        "state_group": filter_state_group,
        "estimate_point": filter_estimate_point,
        "priority": filter_priority,
        "parent": filter_parent,
        "labels": filter_labels,
        "assignees": filter_assignees,
        "mentions": filter_mentions,
        "created_by": filter_created_by,
        "created_by_username": filter_created_by_username,
        "logged_by": filter_logged_by,
        "name": filter_name,
        "created_at": filter_created_at,
        "updated_at": filter_updated_at,
        "start_date": filter_start_date,
        "target_date": filter_target_date,
        "completed_at": filter_completed_at,
        "type": filter_issue_state_type,
        "type_id": filter_issue_type_id,
        "project": filter_project,
        "cycle": filter_cycle,
        "module": filter_module,
        "inbox_status": filter_inbox_status,
        "sub_issue": filter_sub_issue_toggle,
        "subscriber": filter_subscribed_issues,
        "start_target_date": filter_start_target_date_issues,
        "sequence_id" : filter_sequence_id,
        "custom_properties": filter_custom_properties,
        "created_at_ts": filter_created_at_ts,
        "updated_at_ts": filter_updated_at_ts,
    }

    for key, value in ISSUE_FILTER.items():
        if key in query_params:
            func = value
            func(query_params, issue_filter, method, prefix)
            
    filter_character_fields(query_params, issue_filter, method, prefix)
    return issue_filter
