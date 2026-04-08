# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Helper module to map flat tool arguments to the nested 'properties' structure
required for the action summary in the UI.
"""

import re
from typing import Any
from typing import Dict

from pi import logger

log = logger.getChild(__name__)


def is_uuid(value: str) -> bool:
    """Check if a string is a valid UUID."""
    uuid_pattern = re.compile(r"^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$", re.IGNORECASE)
    return bool(uuid_pattern.match(value.strip()))


def map_workitem_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for workitem creation/update tools."""
    properties: Dict[str, Any] = {}

    # Priority: {"name": "low"}
    if "priority" in tool_args and tool_args["priority"]:
        properties["priority"] = {"name": tool_args["priority"]}

    # State: {"id": "uuid"} or {"name": "Done"}
    if "state" in tool_args and tool_args["state"]:
        state_val = tool_args["state"]
        if is_uuid(state_val):
            properties["state"] = {"id": state_val}
        else:
            properties["state"] = {"name": state_val}

    # Assignees: [{"id": "uuid"}, ...] or [] to clear
    if "assignees" in tool_args:
        assignees = tool_args["assignees"]
        if isinstance(assignees, list):
            properties["assignees"] = [{"id": assignee_id} for assignee_id in assignees if assignee_id]

    # Labels: [{"id": "uuid"}, ...] or [] to clear
    if "labels" in tool_args:
        labels = tool_args["labels"]
        if isinstance(labels, list):
            properties["labels"] = [{"id": label_id} for label_id in labels if label_id]

    # Dates: {"name": "YYYY-MM-DD"}
    if "start_date" in tool_args and tool_args["start_date"]:
        properties["start_date"] = {"name": tool_args["start_date"]}

    if "target_date" in tool_args and tool_args["target_date"]:
        properties["target_date"] = {"name": tool_args["target_date"]}

    # Type ID: {"id": "uuid"}
    if "type_id" in tool_args and tool_args["type_id"]:
        properties["type_id"] = {"id": tool_args["type_id"]}

    # Parent: {"id": "uuid"}
    if "parent" in tool_args and tool_args["parent"]:
        properties["parent"] = {"id": tool_args["parent"]}

    # External ID: {"name": "external-123"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    # External Source: {"name": "jira"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    # Is Draft: {"name": true/false}
    if "is_draft" in tool_args and tool_args["is_draft"] is not None:
        properties["is_draft"] = bool(tool_args["is_draft"])

    return properties


def map_project_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for project creation/update tools."""
    properties: Dict[str, Any] = {}

    # Identifier: {"name": "PROJ"}
    if "identifier" in tool_args and tool_args["identifier"]:
        properties["identifier"] = {"name": tool_args["identifier"]}

    # Description: {"name": "text"} - UI often expects simple text wrapped
    if "description" in tool_args and tool_args["description"]:
        properties["description"] = {"name": tool_args["description"]}

    # Project Lead: {"id": "uuid"}
    if "project_lead" in tool_args and tool_args["project_lead"]:
        properties["project_lead"] = {"id": tool_args["project_lead"]}

    # Default Assignee: {"id": "uuid"}
    if "default_assignee" in tool_args and tool_args["default_assignee"]:
        properties["default_assignee"] = {"id": tool_args["default_assignee"]}

    # Icon Prop: {"name": {...}} - JSON object
    if "icon_prop" in tool_args and tool_args["icon_prop"]:
        properties["icon_prop"] = {"name": tool_args["icon_prop"]}

    # Emoji: {"name": "🚀"}
    if "emoji" in tool_args and tool_args["emoji"]:
        properties["emoji"] = {"name": tool_args["emoji"]}

    # Cover Image: {"name": "url"}
    if "cover_image" in tool_args and tool_args["cover_image"]:
        properties["cover_image"] = {"name": tool_args["cover_image"]}

    # Module View: {"name": true/false}
    if "module_view" in tool_args and tool_args["module_view"] is not None:
        properties["module_view"] = bool(tool_args["module_view"])

    # Cycle View: {"name": true/false}
    if "cycle_view" in tool_args and tool_args["cycle_view"] is not None:
        properties["cycle_view"] = bool(tool_args["cycle_view"])

    # Issue Views View: {"name": true/false}
    if "issue_views_view" in tool_args and tool_args["issue_views_view"] is not None:
        properties["issue_views_view"] = bool(tool_args["issue_views_view"])

    # Page View: {"name": true/false}
    if "page_view" in tool_args and tool_args["page_view"] is not None:
        properties["page_view"] = bool(tool_args["page_view"])

    # Intake View: {"name": true/false}
    if "intake_view" in tool_args and tool_args["intake_view"] is not None:
        properties["intake_view"] = bool(tool_args["intake_view"])

    # Guest View All Features: {"name": true/false}
    if "guest_view_all_features" in tool_args and tool_args["guest_view_all_features"] is not None:
        properties["guest_view_all_features"] = bool(tool_args["guest_view_all_features"])

    # Archive In: {"name": 12} - number of months
    if "archive_in" in tool_args and tool_args["archive_in"] is not None:
        properties["archive_in"] = int(tool_args["archive_in"])

    # Close In: {"name": 12} - number of months
    if "close_in" in tool_args and tool_args["close_in"] is not None:
        properties["close_in"] = int(tool_args["close_in"])

    # Timezone: {"name": "UTC"}
    if "timezone" in tool_args and tool_args["timezone"]:
        properties["timezone"] = {"name": tool_args["timezone"]}

    # Time Tracking Enabled: {"name": true/false}
    # Handle both variants: time_tracking_enabled and is_time_tracking_enabled
    if "time_tracking_enabled" in tool_args and tool_args["time_tracking_enabled"] is not None:
        properties["is_time_tracking_enabled"] = bool(tool_args["time_tracking_enabled"])
    elif "is_time_tracking_enabled" in tool_args and tool_args["is_time_tracking_enabled"] is not None:
        properties["is_time_tracking_enabled"] = bool(tool_args["is_time_tracking_enabled"])

    # Issue Type Enabled: {"name": true/false}
    if "is_issue_type_enabled" in tool_args and tool_args["is_issue_type_enabled"] is not None:
        properties["is_issue_type_enabled"] = bool(tool_args["is_issue_type_enabled"])

    return properties


def map_module_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for module creation/update tools and work item operations."""
    properties: Dict[str, Any] = {}

    # Start Date: {"name": "YYYY-MM-DD"}
    if "start_date" in tool_args and tool_args["start_date"]:
        properties["start_date"] = {"name": tool_args["start_date"]}

    # Target Date: {"name": "YYYY-MM-DD"}
    if "target_date" in tool_args and tool_args["target_date"]:
        properties["target_date"] = {"name": tool_args["target_date"]}

    # Status: {"name": "backlog/unstarted/started/completed/cancelled/paused"}
    if "status" in tool_args and tool_args["status"]:
        properties["status"] = {"name": tool_args["status"]}

    # Lead: {"id": "uuid"}
    if "lead" in tool_args and tool_args["lead"]:
        properties["lead"] = {"id": tool_args["lead"]}

    # Members: [{"id": "uuid"}, ...]
    if "members" in tool_args and tool_args["members"]:
        members = tool_args["members"]
        if isinstance(members, list):
            properties["members"] = [{"id": member_id} for member_id in members if member_id]

    # Issues: [{"id": "uuid"}, ...] - for modules_add_work_items
    if "issues" in tool_args and tool_args["issues"]:
        issues = tool_args["issues"]
        if isinstance(issues, list):
            properties["issues"] = [{"id": issue_id} for issue_id in issues if issue_id]

    # Issue ID: {"id": "uuid"} - for modules_remove_work_item
    if "issue_id" in tool_args and tool_args["issue_id"]:
        properties["issue_id"] = {"id": tool_args["issue_id"]}

    # External ID: {"name": "external-123"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    # External Source: {"name": "jira"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    return properties


def map_cycle_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for cycle creation/update tools and work item operations."""
    properties: Dict[str, Any] = {}

    # Start Date: {"name": "YYYY-MM-DD"}
    if "start_date" in tool_args and tool_args["start_date"]:
        properties["start_date"] = {"name": tool_args["start_date"]}

    # End Date: {"name": "YYYY-MM-DD"}
    if "end_date" in tool_args and tool_args["end_date"]:
        properties["end_date"] = {"name": tool_args["end_date"]}

    # Owned By: {"id": "uuid"}
    if "owned_by" in tool_args and tool_args["owned_by"]:
        properties["owned_by"] = {"id": tool_args["owned_by"]}

    # Issues: [{"id": "uuid"}, ...] - for cycles_add_work_items
    if "issues" in tool_args and tool_args["issues"]:
        issues = tool_args["issues"]
        if isinstance(issues, list):
            properties["issues"] = [{"id": issue_id} for issue_id in issues if issue_id]

    # Issue ID: {"id": "uuid"} - for cycles_remove_work_item
    if "issue_id" in tool_args and tool_args["issue_id"]:
        properties["issue_id"] = {"id": tool_args["issue_id"]}

    # New Cycle ID: {"id": "uuid"} - for cycles_transfer_work_items
    if "new_cycle_id" in tool_args and tool_args["new_cycle_id"]:
        properties["new_cycle_id"] = {"id": tool_args["new_cycle_id"]}

    # External ID: {"name": "external-123"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    # External Source: {"name": "jira"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    # Timezone: {"name": "UTC"}
    if "timezone" in tool_args and tool_args["timezone"]:
        properties["timezone"] = {"name": tool_args["timezone"]}

    return properties


def map_intake_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for intake creation/update tools."""
    properties: Dict[str, Any] = {}

    # Priority: {"name": "low/medium/high/urgent/none"}
    if "priority" in tool_args and tool_args["priority"]:
        properties["priority"] = {"name": tool_args["priority"]}

    # Assignee: {"id": "uuid"}
    if "assignee" in tool_args and tool_args["assignee"]:
        properties["assignee"] = {"id": tool_args["assignee"]}

    # Reporter: {"id": "uuid"}
    if "reporter" in tool_args and tool_args["reporter"]:
        properties["reporter"] = {"id": tool_args["reporter"]}

    # Labels: [{"id": "uuid"}, ...]
    if "labels" in tool_args and tool_args["labels"]:
        labels = tool_args["labels"]
        if isinstance(labels, list):
            properties["labels"] = [{"id": label_id} for label_id in labels if label_id]

    return properties


def map_state_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for state creation/update tools."""
    properties: Dict[str, Any] = {}

    # Color: {"name": "#FF5733"}
    if "color" in tool_args and tool_args["color"]:
        properties["color"] = {"name": tool_args["color"]}

    # Group: {"name": "backlog/unstarted/started/completed/cancelled"}
    if "group" in tool_args and tool_args["group"]:
        properties["group"] = {"name": tool_args["group"]}

    # Sequence: {"name": "1"}
    if "sequence" in tool_args and tool_args["sequence"] is not None:
        properties["sequence"] = {"name": str(tool_args["sequence"])}

    # Is Triage: {"name": "true/false"}
    if "is_triage" in tool_args and tool_args["is_triage"] is not None:
        properties["is_triage"] = {"name": str(bool(tool_args["is_triage"])).lower()}

    # Default: {"name": "true/false"}
    if "default" in tool_args and tool_args["default"] is not None:
        properties["default"] = {"name": str(bool(tool_args["default"])).lower()}

    # External ID: {"name": "external-123"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    # External Source: {"name": "jira"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    # Description: {"name": "text"}
    if "description" in tool_args and tool_args["description"]:
        properties["description"] = {"name": tool_args["description"]}

    return properties


def map_label_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for label creation/update tools."""
    properties: Dict[str, Any] = {}

    # Color: {"name": "#FF5733"}
    if "color" in tool_args and tool_args["color"]:
        properties["color"] = {"name": tool_args["color"]}

    # Description: {"name": "text"}
    if "description" in tool_args and tool_args["description"]:
        properties["description"] = {"name": tool_args["description"]}

    # Parent: {"id": "uuid"} - for nested labels
    if "parent" in tool_args and tool_args["parent"]:
        properties["parent"] = {"id": tool_args["parent"]}

    # Sort Order: {"name": "1.5"}
    if "sort_order" in tool_args and tool_args["sort_order"] is not None:
        properties["sort_order"] = {"name": str(tool_args["sort_order"])}

    # External ID: {"name": "external-123"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    # External Source: {"name": "jira"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    return properties


def map_worklog_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for worklog creation/update tools."""
    properties: Dict[str, Any] = {}

    # Description: {"name": "text"}
    if "description" in tool_args and tool_args["description"]:
        properties["description"] = {"name": tool_args["description"]}

    # Duration: {"name": "60"} - duration in minutes
    if "duration" in tool_args and tool_args["duration"] is not None:
        properties["duration"] = {"name": str(tool_args["duration"])}

    # Created By: {"id": "uuid"}
    if "created_by" in tool_args and tool_args["created_by"]:
        properties["created_by"] = {"id": tool_args["created_by"]}

    # Updated By: {"id": "uuid"}
    if "updated_by" in tool_args and tool_args["updated_by"]:
        properties["updated_by"] = {"id": tool_args["updated_by"]}

    return properties


def map_comment_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for comment creation/update tools."""
    properties: Dict[str, Any] = {}

    # Comment HTML: {"name": "<p>text</p>"}
    if "comment_html" in tool_args and tool_args["comment_html"]:
        properties["comment_html"] = {"name": tool_args["comment_html"]}

    # Comment JSON: {"name": "{...}"} - converting dict to string representation
    if "comment_json" in tool_args and tool_args["comment_json"] is not None:
        import json

        properties["comment_json"] = {"name": json.dumps(tool_args["comment_json"])}

    # Access: {"name": "public/private/..."}
    if "access" in tool_args and tool_args["access"]:
        properties["access"] = {"name": tool_args["access"]}

    # External ID: {"name": "external-123"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    # External Source: {"name": "jira"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    return properties


def map_link_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for link creation/update tools."""
    properties: Dict[str, Any] = {}

    # Title: {"name": "Link Title"}
    if "title" in tool_args and tool_args["title"]:
        properties["title"] = {"name": tool_args["title"]}

    # URL: {"name": "https://example.com"}
    if "url" in tool_args and tool_args["url"]:
        properties["url"] = {"name": tool_args["url"]}

    # Metadata: {"name": {...}} - JSON object
    if "metadata" in tool_args and tool_args["metadata"]:
        import json

        if isinstance(tool_args["metadata"], dict):
            properties["metadata"] = {"name": json.dumps(tool_args["metadata"])}
        else:
            properties["metadata"] = {"name": str(tool_args["metadata"])}

    return properties


def map_attachment_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for attachment creation/update tools."""
    properties: Dict[str, Any] = {}

    # Name: {"name": "filename.pdf"}
    if "name" in tool_args and tool_args["name"]:
        properties["name"] = {"name": tool_args["name"]}

    # Type: {"name": "application/pdf"}
    if "type" in tool_args and tool_args["type"]:
        properties["type"] = {"name": tool_args["type"]}

    # Size: {"name": "1024"} - convert int to string
    if "size" in tool_args and tool_args["size"] is not None:
        properties["size"] = {"name": str(tool_args["size"])}

    # External ID: {"name": "external-123"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    # External Source: {"name": "jira"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    # Is Uploaded: {"name": "true/false"} - for update operations
    if "is_uploaded" in tool_args and tool_args["is_uploaded"] is not None:
        properties["is_uploaded"] = {"name": str(bool(tool_args["is_uploaded"])).lower()}

    return properties


def map_property_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for property creation/update tools."""
    properties: Dict[str, Any] = {}

    # Property Type: {"name": "TEXT/DATETIME/..."}
    if "property_type" in tool_args and tool_args["property_type"]:
        properties["property_type"] = {"name": tool_args["property_type"]}

    # Relation Type: {"name": "ONE_TO_ONE/..."}
    if "relation_type" in tool_args and tool_args["relation_type"]:
        properties["relation_type"] = {"name": tool_args["relation_type"]}

    # Is Required: boolean
    if "is_required" in tool_args and tool_args["is_required"] is not None:
        properties["is_required"] = bool(tool_args["is_required"])

    # Default Value: list of strings (keep as-is)
    if "default_value" in tool_args and tool_args["default_value"] is not None:
        properties["default_value"] = tool_args["default_value"]

    # Settings: dict/object (keep as-is)
    if "settings" in tool_args and tool_args["settings"] is not None:
        properties["settings"] = tool_args["settings"]

    # Is Active: boolean
    if "is_active" in tool_args and tool_args["is_active"] is not None:
        properties["is_active"] = bool(tool_args["is_active"])

    # Is Multi: boolean
    if "is_multi" in tool_args and tool_args["is_multi"] is not None:
        properties["is_multi"] = bool(tool_args["is_multi"])

    # Validation Rules: dict/object (keep as-is)
    if "validation_rules" in tool_args and tool_args["validation_rules"] is not None:
        properties["validation_rules"] = tool_args["validation_rules"]

    # External Source: {"name": "value"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    # External ID: {"name": "value"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    return properties


def map_type_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map properties for work item type creation/update tools."""
    properties: Dict[str, Any] = {}

    # Project IDs: [{"id": "uuid"}, ...]
    if "project_ids" in tool_args and tool_args["project_ids"]:
        project_ids = tool_args["project_ids"]
        if isinstance(project_ids, list):
            properties["project_ids"] = [{"id": project_id} for project_id in project_ids if project_id]

    # Is Epic: boolean
    if "is_epic" in tool_args and tool_args["is_epic"] is not None:
        properties["is_epic"] = bool(tool_args["is_epic"])

    # Is Active: boolean
    if "is_active" in tool_args and tool_args["is_active"] is not None:
        properties["is_active"] = bool(tool_args["is_active"])

    # External Source: {"name": "value"}
    if "external_source" in tool_args and tool_args["external_source"]:
        properties["external_source"] = {"name": tool_args["external_source"]}

    # External ID: {"name": "value"}
    if "external_id" in tool_args and tool_args["external_id"]:
        properties["external_id"] = {"name": tool_args["external_id"]}

    return properties


def map_common_properties(tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """Map common properties that might appear in various tools."""
    properties: Dict[str, Any] = {}

    # Handle generic 'name' if it wasn't popped earlier or is needed as property
    # Note: 'name' is usually a root parameter, but sometimes duplicated in properties

    return properties


def map_tool_properties(artifact_type: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point to map tool arguments to the nested 'properties' structure.

    Args:
        artifact_type: Type of the artifact being executed
        tool_args: Dictionary of arguments passed to the tool

    Returns:
        Dictionary representing the 'properties' field in action summary
    """
    properties: Dict[str, Any] = {}

    # Dispatch based on tool name pattern
    if artifact_type == "workitem" or artifact_type == "epic":
        properties.update(map_workitem_properties(tool_args))
    elif artifact_type == "project":
        properties.update(map_project_properties(tool_args))
    elif artifact_type == "module":
        properties.update(map_module_properties(tool_args))
    elif artifact_type == "cycle":
        properties.update(map_cycle_properties(tool_args))
    elif artifact_type == "intake":
        properties.update(map_intake_properties(tool_args))
    elif artifact_type == "label":
        properties.update(map_label_properties(tool_args))
    elif artifact_type == "page":
        return {}  # Page doesn't have any properties other than the basic ones already added in params dict
    elif artifact_type == "state":
        properties.update(map_state_properties(tool_args))
    elif artifact_type == "worklog":
        properties.update(map_worklog_properties(tool_args))
    elif artifact_type == "comment":
        properties.update(map_comment_properties(tool_args))
    elif artifact_type == "attachment":
        properties.update(map_attachment_properties(tool_args))
    elif artifact_type == "link":
        properties.update(map_link_properties(tool_args))
    elif artifact_type == "type":
        properties.update(map_type_properties(tool_args))
    elif artifact_type == "property":
        properties.update(map_property_properties(tool_args))

    # Add any other specific mappers here

    # Fallback/Generic handling for remaining keys could be added here
    # but for now we stick to explicit mappings to avoid cluttering the UI

    return properties
