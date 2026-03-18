"""
Project signals — auto-create default "Daily Status" view when a new project is created.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver


DEFAULT_PROJECT_VIEW_DISPLAY_FILTERS = {
    "layout": "spreadsheet",
    "order_by": "-created_at",
    "group_by": None,
    "sub_issue": True,
    "show_empty_groups": True,
    "type": None,
    "calendar_date_range": "",
}

DEFAULT_PROJECT_VIEW_DISPLAY_PROPERTIES = {
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
    # CE extended properties — 5 of 7 (no department_name, project_name, project_lead)
    "project_lead": False,
    "bank_wide_project": True,
    "progress_tracking": True,
    "completed_date": True,
    "reference_link": True,
    "total_log_time": True,
    # Explicitly disabled for project views
    "department_name": False,
    "project_name": False,
}


@receiver(post_save, sender="db.Project")
def create_default_view_on_project_creation(sender, instance, created, **kwargs):
    """Create the default 'Daily Status' IssueView whenever a new project is created."""
    if not created:
        return

    from plane.db.models import IssueView  # Local import to avoid circular deps

    owned_by = instance.created_by or instance.workspace.owner

    IssueView.objects.create(
        workspace=instance.workspace,
        project=instance,
        name="Daily Status",
        description="Auto-generated daily status view",
        filters={},
        query={},
        display_filters=DEFAULT_PROJECT_VIEW_DISPLAY_FILTERS,
        display_properties=DEFAULT_PROJECT_VIEW_DISPLAY_PROPERTIES,
        rich_filters={},
        access=1,  # Public
        is_default=True,
        is_locked=True,
        owned_by=owned_by,
        logo_props={},
        sort_order=0,
    )
