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

import html
from collections import defaultdict

from plane.utils.html_processor import strip_tags


def _compute_archive_html_blocks(issue_ids, new_type_id, old_type_id=None):
    """
    Compute archive HTML for orphaned property values without writing to DB.

    Returns:
        dict: Mapping of issue_id -> archive HTML string. Empty dict if no orphans.
    """
    from plane.db.models import Issue
    from plane.ee.models.issue_properties import (
        IssuePropertyOption,
        IssuePropertyValue,
        IssueTypeProperty,
        PropertyTypeEnum,
        RelationTypeEnum,
    )

    if not issue_ids:
        return {}

    # Build the same orphan filter as cleanup_orphaned_for_issues
    orphan_qs = IssuePropertyValue.objects.filter(
        issue_id__in=issue_ids
    ).select_related("property")

    if new_type_id:
        valid_property_ids = set(
            IssueTypeProperty.objects.filter(
                issue_type_id=new_type_id, deleted_at__isnull=True
            ).values_list("property_id", flat=True)
        )
        orphan_qs = orphan_qs.exclude(property_id__in=valid_property_ids)

    orphan_values = list(orphan_qs)
    if not orphan_values:
        return {}

    # Resolve old type name
    old_type_name = None
    if old_type_id:
        from plane.db.models import IssueType

        old_type = IssueType.objects.filter(id=old_type_id).values("name").first()
        if old_type:
            old_type_name = old_type["name"]

    # Collect IDs that need batch resolution
    option_ids = set()
    relation_issue_ids = set()
    relation_user_ids = set()

    for val in orphan_values:
        prop = val.property
        if prop.property_type == PropertyTypeEnum.OPTION and val.value_option_id:
            option_ids.add(val.value_option_id)
        elif prop.property_type == PropertyTypeEnum.RELATION and val.value_uuid:
            if prop.relation_type == RelationTypeEnum.ISSUE:
                relation_issue_ids.add(val.value_uuid)
            elif prop.relation_type == RelationTypeEnum.USER:
                relation_user_ids.add(val.value_uuid)

    # Batch-resolve display values
    option_names = {}
    if option_ids:
        option_names = dict(
            IssuePropertyOption.objects.filter(id__in=option_ids).values_list(
                "id", "name"
            )
        )

    issue_identifiers = {}
    if relation_issue_ids:
        related_issues = Issue.objects.filter(
            id__in=relation_issue_ids
        ).values_list("id", "project__identifier", "sequence_id")
        for issue_id, proj_identifier, seq_id in related_issues:
            issue_identifiers[issue_id] = f"{proj_identifier}-{seq_id}"

    user_display_names = {}
    if relation_user_ids:
        from django.contrib.auth import get_user_model

        User = get_user_model()
        users = User.objects.filter(id__in=relation_user_ids).values_list(
            "id", "display_name", "email"
        )
        for uid, display_name, email in users:
            user_display_names[uid] = display_name or email

    # Group: issue_id -> property_id -> list of display strings
    property_map = {}  # property_id -> IssueProperty instance
    grouped = defaultdict(lambda: defaultdict(list))

    for val in orphan_values:
        prop = val.property
        property_map[prop.id] = prop
        display_val = _resolve_display_value(
            val, prop, option_names, issue_identifiers, user_display_names
        )
        if display_val is not None:
            grouped[val.issue_id][prop.id].append(display_val)

    if not grouped:
        return {}

    result = {}
    for issue_id, props_for_issue in grouped.items():
        archive_html = _build_archive_html(props_for_issue, property_map, old_type_name)
        if archive_html:
            result[issue_id] = archive_html
    return result


def compute_archive_html_for_issue(issue_id, new_type_id, old_type_id):
    """Compute archive HTML for a single issue. Returns HTML string or ""."""
    blocks = _compute_archive_html_blocks([issue_id], new_type_id, old_type_id)
    return blocks.get(issue_id, "")


def archive_orphaned_property_values_to_description(
    issue_ids, new_type_id, old_type_id=None
):
    """
    Archive orphaned property values into issue descriptions before they are deleted.

    When an issue's type changes, property values belonging to the old type (but not
    the new) become orphaned. This function appends those values as an HTML block to
    each affected issue's description_html so the data is preserved for users.

    Used by the bulk update path where issues are already saved and descriptions
    must be updated via bulk_update.

    Args:
        issue_ids: List of issue IDs whose type has changed.
        new_type_id: The new type ID (None means type was unset).
        old_type_id: The old type ID (None if unavailable, e.g. bulk update path).
    """
    from plane.db.models import Issue

    blocks = _compute_archive_html_blocks(issue_ids, new_type_id, old_type_id)
    if not blocks:
        return

    # Fetch issues that need description updates
    issues_to_update = Issue.objects.filter(id__in=blocks.keys()).only(
        "id", "description_html"
    )

    updated_issues = []
    for issue in issues_to_update:
        archive_html = blocks.get(issue.id)
        if not archive_html:
            continue

        current_html = issue.description_html or ""
        # If description is effectively empty, replace it
        if current_html.strip() in ("", "<p></p>"):
            issue.description_html = archive_html
        else:
            issue.description_html = current_html + archive_html

        issue.description_stripped = strip_tags(issue.description_html)
        updated_issues.append(issue)

    if updated_issues:
        Issue.objects.bulk_update(
            updated_issues, ["description_html", "description_stripped"]
        )


def _resolve_display_value(
    val, prop, option_names, issue_identifiers, user_display_names
):
    """Resolve a single IssuePropertyValue to a human-readable string."""
    from plane.ee.models.issue_properties import PropertyTypeEnum, RelationTypeEnum

    ptype = prop.property_type

    if ptype in (
        PropertyTypeEnum.TEXT,
        PropertyTypeEnum.URL,
        PropertyTypeEnum.EMAIL,
        PropertyTypeEnum.FILE,
    ):
        return val.value_text if val.value_text else None

    if ptype == PropertyTypeEnum.DATETIME:
        if val.value_datetime:
            return val.value_datetime.strftime("%Y-%m-%d")
        return None

    if ptype == PropertyTypeEnum.DECIMAL:
        num = val.value_decimal
        if num is None:
            return None
        # Strip trailing .0 for whole numbers
        return str(int(num)) if num == int(num) else str(num)

    if ptype == PropertyTypeEnum.BOOLEAN:
        return "Yes" if val.value_boolean else "No"

    if ptype == PropertyTypeEnum.OPTION:
        if val.value_option_id:
            return option_names.get(val.value_option_id, str(val.value_option_id))
        return None

    if ptype == PropertyTypeEnum.RELATION:
        if not val.value_uuid:
            return None
        if prop.relation_type == RelationTypeEnum.ISSUE:
            return issue_identifiers.get(val.value_uuid, str(val.value_uuid))
        if prop.relation_type == RelationTypeEnum.USER:
            return user_display_names.get(val.value_uuid, str(val.value_uuid))
        return str(val.value_uuid)

    # FORMULA and unknown types are skipped
    return None


def _build_archive_html(props_for_issue, property_map, old_type_name):
    """Build the HTML block to append to an issue's description."""
    if old_type_name:
        heading = f"Archived properties (from type: {html.escape(old_type_name)})"
    else:
        heading = "Archived properties"

    li_items = []
    # Sort by property sort_order for consistent ordering
    for prop_id in sorted(
        props_for_issue.keys(), key=lambda pid: property_map[pid].sort_order
    ):
        prop = property_map[prop_id]
        values = props_for_issue[prop_id]
        display_name = html.escape(prop.display_name)
        joined = ", ".join(html.escape(v) for v in values)
        li_items.append(f"<li><strong>{display_name}:</strong> {joined}</li>")

    if not li_items:
        return ""

    items_html = "".join(li_items)
    return (
        f"<hr><blockquote><p><strong>{heading}</strong></p>"
        f"<ul>{items_html}</ul></blockquote>"
    )
