from datetime import datetime, timedelta, date
from django.utils import timezone
from typing import Dict, Optional, List, Union, Tuple, Any

from plane.db.models import User


def get_analytics_date_range(
    date_filter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Optional[Dict[str, Dict[str, datetime]]]:
    """
    Get date range for analytics with current and previous periods for comparison.
    Returns a dictionary with current and previous date ranges.

    Args:
        date_filter (str): The type of date filter to apply
        start_date (str): Start date for custom range (format: YYYY-MM-DD)
        end_date (str): End date for custom range (format: YYYY-MM-DD)

    Returns:
        dict: Dictionary containing current and previous date ranges
    """
    if not date_filter:
        return None

    today = timezone.now().date()

    if date_filter == "yesterday":
        yesterday = today - timedelta(days=1)
        return {
            "current": {
                "gte": datetime.combine(yesterday, datetime.min.time()),
                "lte": datetime.combine(yesterday, datetime.max.time()),
            }
        }
    elif date_filter == "last_7_days":
        return {
            "current": {
                "gte": datetime.combine(today - timedelta(days=7), datetime.min.time()),
                "lte": datetime.combine(today, datetime.max.time()),
            },
            "previous": {
                "gte": datetime.combine(today - timedelta(days=14), datetime.min.time()),
                "lte": datetime.combine(today - timedelta(days=8), datetime.max.time()),
            },
        }
    elif date_filter == "last_30_days":
        return {
            "current": {
                "gte": datetime.combine(today - timedelta(days=30), datetime.min.time()),
                "lte": datetime.combine(today, datetime.max.time()),
            },
            "previous": {
                "gte": datetime.combine(today - timedelta(days=60), datetime.min.time()),
                "lte": datetime.combine(today - timedelta(days=31), datetime.max.time()),
            },
        }
    elif date_filter == "last_3_months":
        return {
            "current": {
                "gte": datetime.combine(today - timedelta(days=90), datetime.min.time()),
                "lte": datetime.combine(today, datetime.max.time()),
            },
            "previous": {
                "gte": datetime.combine(today - timedelta(days=180), datetime.min.time()),
                "lte": datetime.combine(today - timedelta(days=91), datetime.max.time()),
            },
        }
    elif date_filter == "custom" and start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            return {
                "current": {
                    "gte": datetime.combine(start, datetime.min.time()),
                    "lte": datetime.combine(end, datetime.max.time()),
                }
            }
        except (ValueError, TypeError):
            return None
    return None


def get_chart_period_range(
    date_filter: Optional[str] = None,
) -> Optional[Tuple[date, date]]:
    """
    Get date range for chart visualization.
    Returns a tuple of (start_date, end_date) for the specified period.

    Args:
        date_filter (str): The type of date filter to apply. Options are:
            - "yesterday": Yesterday's date
            - "last_7_days": Last 7 days
            - "last_30_days": Last 30 days
            - "last_3_months": Last 90 days
            Defaults to "last_7_days" if not specified or invalid.

    Returns:
        tuple: A tuple containing (start_date, end_date) as date objects
    """
    if not date_filter:
        return None

    today = timezone.now().date()
    period_ranges = {
        "yesterday": (
            today - timedelta(days=1),
            today - timedelta(days=1),
        ),
        "last_7_days": (today - timedelta(days=7), today),
        "last_30_days": (today - timedelta(days=30), today),
        "last_3_months": (today - timedelta(days=90), today),
    }

    return period_ranges.get(date_filter, None)


def get_analytics_filters(
    slug: str,
    user: User,
    type: str,
    date_filter: Optional[str] = None,
    project_ids: Optional[Union[str, List[str]]] = None,
) -> Dict[str, Any]:
    """
    Get combined project and date filters for analytics endpoints

    Args:
        slug: The workspace slug
        user: The current user
        type: The type of filter ("analytics" or "chart")
        date_filter: Optional date filter string
        project_ids: Optional list of project IDs or comma-separated string of project IDs

    Returns:
        dict: A dictionary containing:
            - base_filters: Base filters for the workspace and user
            - project_filters: Project-specific filters
            - analytics_date_range: Date range filters for analytics comparison
            - chart_period_range: Date range for chart visualization
    """
    # Get project IDs from request
    if project_ids and isinstance(project_ids, str):
        project_ids = [str(project_id) for project_id in project_ids.split(",")]

    # Base filters for workspace and user
    base_filters = {
        "workspace__slug": slug,
        "project__project_projectmember__member": user,
        "project__project_projectmember__is_active": True,
        "project__deleted_at__isnull": True,
        "project__archived_at__isnull": True,
    }

    # Project filters
    project_filters = {
        "workspace__slug": slug,
        "project_projectmember__member": user,
        "project_projectmember__is_active": True,
        "deleted_at__isnull": True,
        "archived_at__isnull": True,
    }

    # Add project IDs to filters if provided
    if project_ids:
        base_filters["project_id__in"] = project_ids
        project_filters["id__in"] = project_ids

    # Initialize date range variables
    analytics_date_range = None
    chart_period_range = None

    # Get date range filters based on type
    if type == "analytics":
        analytics_date_range = get_analytics_date_range(date_filter)
    elif type == "chart":
        chart_period_range = get_chart_period_range(date_filter)

    return {
        "base_filters": base_filters,
        "project_filters": project_filters,
        "analytics_date_range": analytics_date_range,
        "chart_period_range": chart_period_range,
    }
