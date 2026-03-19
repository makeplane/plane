"""
Workspace signals — auto-create default "Daily Status" view when a new workspace is created.
"""

import uuid

from django.db.models.signals import post_save
from django.dispatch import receiver


DEFAULT_VIEW_FILTERS = {}

DEFAULT_VIEW_DISPLAY_FILTERS = {
    "layout": "spreadsheet",
    "order_by": "-created_at",
    "group_by": None,
    "sub_issue": True,
    "show_empty_groups": True,
    "type": None,
    "calendar_date_range": "",
}

DEFAULT_VIEW_DISPLAY_PROPERTIES = {
    "assignee": True,
    "start_date": True,
    "due_date": True,
    "labels": False,
    "key": True,
    "priority": True,
    "state": True,
    "sub_issue_count": True,
    "link": False,
    "attachment_count": False,
    "estimate": False,
    "created_on": False,
    "updated_on": False,
    "modules": True,
    "cycle": True,
    "issue_type": False,
    # CE extended properties
    "department_name": True,
    "project_name": True,
    "project_lead": True,
    "bank_wide_project": True,
    "progress_tracking": True,
    "completed_date": True,
    "reference_link": True,
    "total_log_time": True,
}


@receiver(post_save, sender="db.Workspace")
def create_default_view_on_workspace_creation(sender, instance, created, **kwargs):
    """Create the default 'Daily Status' IssueView whenever a new workspace is created."""
    if not created:
        return

    from plane.db.models import IssueView  # Local import to avoid circular deps

    IssueView.objects.create(
        workspace=instance,
        name="Daily Status",
        description="Auto-generated daily status view",
        filters=DEFAULT_VIEW_FILTERS,
        query={},
        display_filters=DEFAULT_VIEW_DISPLAY_FILTERS,
        display_properties=DEFAULT_VIEW_DISPLAY_PROPERTIES,
        rich_filters={},
        access=1,  # Public
        is_default=True,
        is_locked=True,
        owned_by=instance.owner,
        logo_props={},
        sort_order=0,
    )
