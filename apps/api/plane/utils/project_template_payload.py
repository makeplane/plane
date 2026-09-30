# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re
import uuid

from rest_framework import serializers

from plane.db.models import Project, Workspace, WorkspaceMember

ALLOWED_PAYLOAD_KEYS = {
    "name",
    "identifier",
    "description",
    "start_date",
    "target_date",
    "network",
    "project_lead",
    "default_assignee",
    "logo_props",
    "cover_image_url",
    "cycle_view",
    "module_view",
    "issue_views_view",
    "page_view",
    "intake_view",
    "is_time_tracking_enabled",
    "is_issue_type_enabled",
    "guest_view_all_features",
    "epic_enabled",
    "state_templates",
    "label_templates",
    "task_custom_properties",
    "epic_custom_properties",
    "additional_work_item_types",
}

# Columns that only a work item export carries. Shared with the work item importer, which
# uses them to recognise its own files; kept here to avoid an import cycle between the two.
WORK_ITEM_EXPORT_HINT_KEYS = {
    "project_name",
    "project_identifier",
    "state_name",
    "sequence_id",
    "priority",
    "assignees",
    "labels",
    "modules",
    "cycles",
    "created_by_name",
    "created_at",
    "updated_at",
}

_TEMPLATE_CUSTOM_PROPERTY_LIMIT = 50
_TEMPLATE_ADDITIONAL_ISSUE_TYPES_LIMIT = 20
_ALLOWED_PROPERTY_TYPES = {"text", "number", "dropdown", "boolean", "date", "member_picker"}
_ALLOWED_SELECT_MODES = {"single", "multi"}

BOOLEAN_KEYS = {
    "cycle_view",
    "module_view",
    "issue_views_view",
    "page_view",
    "intake_view",
    "is_time_tracking_enabled",
    "is_issue_type_enabled",
    "guest_view_all_features",
    "epic_enabled",
}


def _clean_custom_property(item: dict) -> dict | None:
    if not isinstance(item, dict):
        raise serializers.ValidationError({"payload": "custom property items must be objects"})
    title = str(item.get("title", "")).strip()
    if not title:
        return None
    property_type = str(item.get("property_type", "text")).strip().lower()
    if property_type not in _ALLOWED_PROPERTY_TYPES:
        raise serializers.ValidationError({"payload": f"Invalid property_type: {property_type}"})
    row = {
        "title": title[:255],
        "description": str(item.get("description", "") or "").strip()[:2000],
        "is_mandatory": bool(item.get("is_mandatory", False)),
        "is_active": bool(item.get("is_active", True)),
        "property_type": property_type,
    }
    if property_type == "dropdown":
        options_raw = item.get("options")
        if not isinstance(options_raw, list):
            raise serializers.ValidationError({"payload": "dropdown options must be an array"})
        options = [str(o).strip()[:255] for o in options_raw if str(o).strip()][:30]
        if not options:
            raise serializers.ValidationError({"payload": "dropdown must include at least one option"})
        select_mode = str(item.get("select_mode", "single")).strip().lower()
        if select_mode not in _ALLOWED_SELECT_MODES:
            select_mode = "single"
        row["options"] = options
        row["select_mode"] = select_mode
        default_option = item.get("default_option")
        if default_option not in [None, ""] and select_mode == "single":
            default_str = str(default_option).strip()
            if default_str in options:
                row["default_option"] = default_str
    return row


def _clean_custom_property_list(value, *, label: str) -> list:
    if value in [None, []]:
        return []
    if not isinstance(value, list):
        raise serializers.ValidationError({"payload": f"{label} must be an array"})
    rows = []
    for item in value[:_TEMPLATE_CUSTOM_PROPERTY_LIMIT]:
        cleaned = _clean_custom_property(item)
        if cleaned:
            rows.append(cleaned)
    return rows


def _clean_additional_work_item_types(value) -> list:
    if value in [None, []]:
        return []
    if not isinstance(value, list):
        raise serializers.ValidationError({"payload": "additional_work_item_types must be an array"})
    rows = []
    for item in value[:_TEMPLATE_ADDITIONAL_ISSUE_TYPES_LIMIT]:
        if not isinstance(item, dict):
            raise serializers.ValidationError({"payload": "additional_work_item_types items must be objects"})
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        description = str(item.get("description", "") or "").strip()[:2000]
        props_raw = item.get("custom_properties")
        props = _clean_custom_property_list(props_raw, label="additional_work_item_types.custom_properties")
        rows.append({"name": name[:255], "description": description, "custom_properties": props})
    return rows


def _is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def _coerce_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def validate_and_clean_project_payload(payload: dict, workspace: Workspace, *, require_identity: bool = False) -> dict:
    if not isinstance(payload, dict):
        raise serializers.ValidationError({"payload": "Payload must be an object"})

    unknown_keys = set(payload.keys()) - ALLOWED_PAYLOAD_KEYS
    if unknown_keys:
        hint_overlap = unknown_keys.intersection(WORK_ITEM_EXPORT_HINT_KEYS)
        if len(hint_overlap) >= 3:
            raise serializers.ValidationError(
                {
                    "payload": (
                        "Ten plik wygląda na eksport elementów roboczych (work items), "
                        "a nie na szablon projektu. "
                        "Aby wczytać szablon, użyj pliku pobranego przyciskiem „Pobierz szablon”."
                    )
                }
            )
        raise serializers.ValidationError({"payload": f"Unsupported keys: {', '.join(sorted(unknown_keys))}"})

    cleaned: dict = {}
    for key, value in payload.items():
        if key in {"name", "description"}:
            if value is None:
                continue
            cleaned[key] = str(value).strip()
            continue
        if key == "identifier":
            if value is None or str(value).strip() == "":
                continue
            identifier = str(value).strip().upper()
            if re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, identifier):
                raise serializers.ValidationError({"payload": "identifier cannot contain special characters"})
            cleaned[key] = identifier
            continue
        if key == "network":
            if value in [None, ""]:
                continue
            network = int(value)
            if network not in [0, 2]:
                raise serializers.ValidationError({"payload": "network must be 0 or 2"})
            cleaned[key] = network
            continue
        if key in {"start_date", "target_date"}:
            if value in [None, ""]:
                cleaned[key] = None
                continue
            if not isinstance(value, str) or not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
                raise serializers.ValidationError({"payload": f"{key} must match YYYY-MM-DD"})
            cleaned[key] = value
            continue
        if key in {"project_lead", "default_assignee"}:
            if value in [None, ""]:
                cleaned[key] = None
                continue
            if not _is_valid_uuid(str(value)):
                raise serializers.ValidationError({"payload": f"{key} must be a UUID"})
            is_member = WorkspaceMember.objects.filter(
                workspace_id=workspace.id,
                member_id=value,
                is_active=True,
            ).exists()
            if not is_member:
                raise serializers.ValidationError({"payload": f"{key} must belong to workspace"})
            cleaned[key] = str(value)
            continue
        if key == "logo_props":
            if value is None:
                cleaned[key] = None
            elif isinstance(value, dict):
                cleaned[key] = value
            else:
                raise serializers.ValidationError({"payload": "logo_props must be an object"})
            continue
        if key == "cover_image_url":
            if value in [None, ""]:
                cleaned[key] = None
            elif isinstance(value, str):
                cleaned[key] = value.strip()
            else:
                raise serializers.ValidationError({"payload": "cover_image_url must be a string"})
            continue
        if key in BOOLEAN_KEYS:
            cleaned[key] = _coerce_bool(value)
            continue
        if key == "state_templates":
            if value in [None, []]:
                cleaned[key] = []
                continue
            if not isinstance(value, list):
                raise serializers.ValidationError({"payload": "state_templates must be an array"})
            states = []
            for state in value:
                if not isinstance(state, dict):
                    raise serializers.ValidationError({"payload": "state_templates items must be objects"})
                name = str(state.get("name", "")).strip()
                if not name:
                    continue
                group = str(state.get("group", "unstarted")).strip().lower()
                if group not in {"backlog", "unstarted", "started", "completed", "cancelled"}:
                    group = "unstarted"
                color = state.get("color")
                if color not in [None, ""] and (
                    not isinstance(color, str) or not re.match(r"^#[0-9A-Fa-f]{6}$", color)
                ):
                    raise serializers.ValidationError({"payload": "state_templates color must be a hex string"})
                states.append(
                    {
                        "name": name[:255],
                        "group": group,
                        "color": color if color not in [""] else None,
                        "default": bool(state.get("default", False)),
                    }
                )
            cleaned[key] = states
            continue
        if key == "label_templates":
            if value in [None, []]:
                cleaned[key] = []
                continue
            if not isinstance(value, list):
                raise serializers.ValidationError({"payload": "label_templates must be an array"})
            labels = []
            for label in value:
                if not isinstance(label, dict):
                    raise serializers.ValidationError({"payload": "label_templates items must be objects"})
                name = str(label.get("name", "")).strip()
                if not name:
                    continue
                color = label.get("color")
                if color not in [None, ""] and (
                    not isinstance(color, str) or not re.match(r"^#[0-9A-Fa-f]{6}$", color)
                ):
                    raise serializers.ValidationError({"payload": "label_templates color must be a hex string"})
                labels.append({"name": name[:255], "color": color if color not in [""] else None})
            cleaned[key] = labels
            continue
        if key in {"task_custom_properties", "epic_custom_properties"}:
            cleaned[key] = _clean_custom_property_list(value, label=key)
            continue
        if key == "additional_work_item_types":
            cleaned[key] = _clean_additional_work_item_types(value)
            continue

    if require_identity:
        if not str(cleaned.get("name", "")).strip():
            raise serializers.ValidationError({"payload": "name is required"})
        if not str(cleaned.get("identifier", "")).strip():
            raise serializers.ValidationError({"payload": "identifier is required"})

    return cleaned
