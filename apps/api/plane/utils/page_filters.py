# Python imports
import re
import uuid
from datetime import timedelta

# Django imports
from django.utils import timezone


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
def string_date_filter(page_filter, duration, subsequent, term, date_filter, offset):
    now = timezone.now().date()
    if term == "months":
        if subsequent == "after":
            if offset == "fromnow":
                page_filter[f"{date_filter}__gte"] = now + timedelta(days=duration * 30)
            else:
                page_filter[f"{date_filter}__gte"] = now - timedelta(days=duration * 30)
        else:
            if offset == "fromnow":
                page_filter[f"{date_filter}__lte"] = now + timedelta(days=duration * 30)
            else:
                page_filter[f"{date_filter}__lte"] = now - timedelta(days=duration * 30)
    if term == "weeks":
        if subsequent == "after":
            if offset == "fromnow":
                page_filter[f"{date_filter}__gte"] = now + timedelta(weeks=duration)
            else:
                page_filter[f"{date_filter}__gte"] = now - timedelta(weeks=duration)
        else:
            if offset == "fromnow":
                page_filter[f"{date_filter}__lte"] = now + timedelta(weeks=duration)
            else:
                page_filter[f"{date_filter}__lte"] = now - timedelta(weeks=duration)


def date_filter(page_filter, date_term, queries):
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
                            page_filter=page_filter,
                            duration=int(digit),
                            subsequent=date_query[1],
                            term=term,
                            date_filter=date_term,
                            offset=date_query[2],
                        )
                else:
                    if "after" in date_query:
                        page_filter[f"{date_term}__gte"] = date_query[0]
                    else:
                        page_filter[f"{date_term}__lte"] = date_query[0]
            else:
                page_filter[f"{date_term}__contains"] = date_query[0]


def filter_created_by(params, page_filter, method, prefix=""):
    if method == "GET":
        created_bys = [item for item in params.get("created_by").split(",") if item != "null"]
        if "None" in created_bys:
            page_filter[f"{prefix}owned_by__isnull"] = True
        created_bys = filter_valid_uuids(created_bys)
        if len(created_bys) and "" not in created_bys:
            page_filter[f"{prefix}owned_by__in"] = created_bys
    else:
        if params.get("created_by", None) and len(params.get("created_by")) and params.get("created_by") != "null":
            page_filter[f"{prefix}owned_by__in"] = params.get("created_by")
    return page_filter


def filter_created_at(params, page_filter, method, prefix=""):
    if method == "GET":
        created_ats = params.get("created_at").split(",")
        if len(created_ats) and "" not in created_ats:
            date_filter(
                page_filter=page_filter,
                date_term=f"{prefix}created_at__date",
                queries=created_ats,
            )
    else:
        if params.get("created_at", None) and len(params.get("created_at")):
            date_filter(
                page_filter=page_filter,
                date_term=f"{prefix}created_at__date",
                queries=params.get("created_at", []),
            )
    return page_filter


def filter_favorites(params, page_filter, method, prefix=""):
    if method == "GET":
        favorites = params.get("favorites", "false").lower()
        if favorites == "true":
            page_filter[f"{prefix}is_favorite"] = True
    else:
        if params.get("favorites", False):
            page_filter[f"{prefix}is_favorite"] = True

    return page_filter


def filter_search(params, page_filter, method, prefix=""):
    if method == "GET":
        search = params.get("search", None)
        if search:
            page_filter[f"{prefix}name__icontains"] = search
    else:
        if params.get("search", None):
            page_filter[f"{prefix}name__icontains"] = params.get("search")
    
    return page_filter


def page_filters(query_params, method, prefix=""):
    page_filter = {}

    PAGE_FILTER_MAP = {
        "created_by": filter_created_by,
        "created_at": filter_created_at,
        "favorites": filter_favorites,
        "search": filter_search,
    }

    for key, value in PAGE_FILTER_MAP.items():
        if key in query_params:
            func = value
            func(query_params, page_filter, method, prefix)

    return page_filter
