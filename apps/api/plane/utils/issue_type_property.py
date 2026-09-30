# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

ALLOWED_PROPERTY_TYPES = frozenset({"text", "number", "dropdown", "boolean", "date", "member_picker"})
ALLOWED_SELECT_MODES = frozenset({"single", "multi"})
PROPERTY_LIMIT = 50


def clean_property_payload(item: dict) -> dict | None:
    if not isinstance(item, dict):
        raise ValueError("property items must be objects")
    title = str(item.get("title", "")).strip()
    if not title:
        return None
    property_type = str(item.get("property_type", "text")).strip().lower()
    if property_type not in ALLOWED_PROPERTY_TYPES:
        raise ValueError(f"Invalid property_type: {property_type}")
    row = {
        "title": title[:255],
        "description": str(item.get("description", "") or "").strip()[:2000],
        "is_mandatory": bool(item.get("is_mandatory", False)),
        "is_active": bool(item.get("is_active", True)),
        "property_type": property_type,
    }
    if item.get("id"):
        row["id"] = str(item.get("id"))
    if property_type == "dropdown":
        options_raw = item.get("options")
        if not isinstance(options_raw, list):
            raise ValueError("dropdown options must be an array")
        options = [str(o).strip()[:255] for o in options_raw if str(o).strip()][:30]
        if not options:
            raise ValueError("dropdown must include at least one option")
        select_mode = str(item.get("select_mode", "single")).strip().lower()
        if select_mode not in ALLOWED_SELECT_MODES:
            select_mode = "single"
        row["options"] = options
        row["select_mode"] = select_mode
        default_option = item.get("default_option")
        if default_option not in [None, ""] and select_mode == "single":
            default_str = str(default_option).strip()
            if default_str in options:
                row["default_value"] = default_str
    elif property_type == "boolean":
        if "default_value" in item and item["default_value"] is not None:
            row["default_value"] = bool(item["default_value"])
    elif property_type in {"text", "number", "date", "member_picker"}:
        if "default_value" in item and item["default_value"] not in [None, ""]:
            row["default_value"] = item["default_value"]
    return row


def clean_property_list(value) -> list[dict]:
    if value in [None, []]:
        return []
    if not isinstance(value, list):
        raise ValueError("properties must be an array")
    rows = []
    for item in value[:PROPERTY_LIMIT]:
        cleaned = clean_property_payload(item)
        if cleaned:
            rows.append(cleaned)
    return rows


def validate_property_value(*, property_type: str, value, select_mode: str = "single", options: list | None = None):
    if value is None:
        return None
    if property_type == "text":
        return str(value)[:4000]
    if property_type == "number":
        try:
            return float(value)
        except (TypeError, ValueError):
            raise ValueError("Invalid number value")
    if property_type == "boolean":
        if isinstance(value, bool):
            return value
        if str(value).lower() in {"true", "1", "yes"}:
            return True
        if str(value).lower() in {"false", "0", "no"}:
            return False
        raise ValueError("Invalid boolean value")
    if property_type == "date":
        text = str(value).strip()
        if not text:
            return None
        return text[:32]
    if property_type == "dropdown":
        opts = options or []
        if select_mode == "multi":
            if not isinstance(value, list):
                raise ValueError("Multi-select value must be an array")
            return [str(v).strip() for v in value if str(v).strip() in opts]
        text = str(value).strip()
        if text and text not in opts:
            raise ValueError("Invalid dropdown option")
        return text or None
    if property_type == "member_picker":
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        text = str(value).strip()
        return [text] if text else []
    return value
