import datetime
import functools
import logging
import re
import uuid
from typing import Any, Dict, Optional
from urllib.parse import urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger("plane.worker")


SCHEDULED_EVENT_CATEGORIES = {
    "game": "Game",
    "practice": "Practice",
    "scrimmage": "Scrimmage",
    "other": "Other",
}
JSON_SCALAR_TYPES = (str, int, float, bool)
NULLISH_STRINGS = frozenset({"none", "null", "undefined", "n/a", "na", "nan"})
STRING_LOOKUP_KEYS = ("name", "label", "title", "display_name", "value", "id")
DATE_FIELD_CANDIDATES = ("start_date", "target_date", "due_date")
TEAM_ID_KEYS = ("team_id", "teamId", "team", "team_detail", "team_details")
CLOCK_TIME_PATTERN = re.compile(r"^(\d{1,2}):(\d{2})(?::\d{2})?$")
FLEX_CLOCK_TIME_PATTERN = re.compile(
    r"^\s*(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?\s*([a-zA-Z.\s]*)\s*$"
)
SESSION_YEAR_PATTERN = re.compile(r"^\s*(\d{4})\s*[-/]\s*(\d{4})\s*$")


def _none_if_blank(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        if value.lower() in NULLISH_STRINGS:
            return None
        return value
    return value


def _json_safe_value(value: Any) -> Any:
    value = _none_if_blank(value)
    if value is None or isinstance(value, JSON_SCALAR_TYPES):
        return value
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, dict):
        return {str(key): _json_safe_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe_value(item) for item in value]
    return str(value)


def _pick_first(event_data: Dict[str, Any], *keys: str) -> Any:
    if not isinstance(event_data, dict):
        return None
    for key in keys:
        value = _none_if_blank(event_data.get(key))
        if value is not None:
            return value
    return None


def _string_field(value: Any) -> Optional[str]:
    value = _none_if_blank(value)
    if value is None:
        return None

    if isinstance(value, (str, int, float, bool, uuid.UUID)):
        return str(value)

    if isinstance(value, dict):
        for key in STRING_LOOKUP_KEYS:
            picked = _none_if_blank(value.get(key))
            if picked is not None and not isinstance(picked, (dict, list, tuple, set)):
                return str(picked)
        return None

    if isinstance(value, (list, tuple, set)):
        for item in value:
            candidate = _string_field(item)
            if candidate is not None:
                return candidate
        return None

    return str(value)


def _int_field(value: Any) -> Optional[int]:
    value = _none_if_blank(value)
    if value is None:
        return None

    if isinstance(value, bool):
        return int(value)

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return int(value)

    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if text.startswith(("+", "-")):
            return int(text) if text[1:].isdigit() else None
        return int(text) if text.isdigit() else None

    if isinstance(value, dict):
        for key in ("team_id", "teamId", "id", "value"):
            nested = _int_field(value.get(key))
            if nested is not None:
                return nested

    return None


def _clean_phone(value: Any) -> Optional[str]:
    value = _none_if_blank(value)
    if value is None:
        return None

    text = str(value).strip()
    lowered = text.lower()
    if "undefined" in lowered or lowered in NULLISH_STRINGS:
        return None

    return text


def _normalize_contact_item(source: Dict[str, Any]) -> Dict[str, Any]:
    phone = _clean_phone(_pick_first(source, "phone", "mobile", "phone_number"))
    country_code = _string_field(_pick_first(source, "country_Code", "country_code", "countryCode"))
    if country_code is None and phone and phone.startswith("+1"):
        country_code = "US"

    return {
        "contact_name": _string_field(_pick_first(source, "contact_name", "display_name", "name", "first_name")),
        "country_Code": country_code,
        "email": _string_field(source.get("email")),
        "phone": phone,
    }


def _extract_date(event_data: Dict[str, Any]) -> Optional[str]:
    for key in DATE_FIELD_CANDIDATES:
        value = _none_if_blank(event_data.get(key))
        if not value:
            continue
        value = str(value)
        if len(value) >= 10 and value[4] == "-" and value[7] == "-":
            return value[:10]
    return None


def _parse_session_year_range(event_data: Dict[str, Any]) -> Optional[tuple[int, int]]:
    raw_year = _string_field(_pick_first(event_data, "year", "session", "season", "academic_year", "academicYear"))
    if not raw_year:
        return None

    match = SESSION_YEAR_PATTERN.match(raw_year)
    if not match:
        return None

    start_year = int(match.group(1))
    end_year = int(match.group(2))
    if end_year < start_year:
        return None
    return start_year, end_year


def _normalize_session_year_text(event_data: Dict[str, Any]) -> Optional[str]:
    year_range = _parse_session_year_range(event_data)
    if year_range is None:
        return _string_field(event_data.get("year"))
    return f"{year_range[0]}-{year_range[1]}"


def _align_event_date_to_session(event_date: Optional[str], event_data: Dict[str, Any]) -> Optional[str]:
    if not event_date:
        return event_date

    year_range = _parse_session_year_range(event_data)
    if year_range is None:
        return event_date

    start_year, end_year = year_range
    try:
        dt = datetime.date.fromisoformat(event_date)
    except ValueError:
        return event_date

    if start_year <= dt.year <= end_year:
        return event_date

    target_year = start_year if dt.month >= 7 else end_year
    try:
        aligned = dt.replace(year=target_year)
    except ValueError:
        if dt.month == 2 and dt.day == 29:
            aligned = datetime.date(target_year, 2, 28)
        else:
            return event_date

    logger.info(
        "Aligned event date %s -> %s using session %s-%s for work-item %s",
        event_date,
        aligned.isoformat(),
        start_year,
        end_year,
        event_data.get("id"),
    )
    return aligned.isoformat()


def _parse_meridiem_token(raw_token: str) -> Optional[str]:
    token = re.sub(r"[^a-z]", "", raw_token.lower())
    if not token:
        return None
    if token in {"am", "a"}:
        return "am"
    if token in {"pm", "p"}:
        return "pm"
    if token.endswith("p"):
        return "pm"
    if token.endswith("a"):
        return "am"
    return None


@functools.lru_cache(maxsize=4)
def _service_gateway_tzinfo() -> datetime.tzinfo:
    tz_name = (
        _none_if_blank(getattr(settings, "SERVICE_GATEWAY_TIMEZONE", None))
        or _none_if_blank(getattr(settings, "TIME_ZONE", None))
        or "UTC"
    )
    try:
        return ZoneInfo(str(tz_name))
    except Exception:
        return timezone.get_default_timezone()


def _parse_clock_time(value: Any) -> Optional[tuple[int, int]]:
    value = _none_if_blank(value)
    if not value:
        return None

    text = str(value).strip()
    normalized = text.replace(".", ":")
    match = FLEX_CLOCK_TIME_PATTERN.match(normalized)
    if not match:
        match = CLOCK_TIME_PATTERN.match(text)
        if not match:
            return None
        hour = int(match.group(1))
        minute = int(match.group(2))
        if hour > 23 or minute > 59:
            return None
        return hour, minute

    hour = int(match.group(1))
    minute = int(match.group(2))
    if minute > 59:
        return None

    meridiem = _parse_meridiem_token(match.group(4) or "")
    raw_suffix = (match.group(4) or "").strip()
    if raw_suffix and meridiem is None:
        return None

    if meridiem is None:
        if hour > 23:
            return None
    else:
        if hour < 1 or hour > 12:
            return None
        if meridiem == "am":
            hour = 0 if hour == 12 else hour
        else:
            hour = hour if hour == 12 else hour + 12

    return hour, minute


def _parse_datetime(value: Any) -> Optional[datetime.datetime]:
    value = _none_if_blank(value)
    if not value:
        return None

    clock = _parse_clock_time(value)
    if clock is not None:
        hour, minute = clock
        now = timezone.localtime()
        return now.replace(hour=hour, minute=minute, second=0, microsecond=0)

    if isinstance(value, datetime.datetime):
        dt = value
    else:
        text = str(value).strip()
        if not text:
            return None
        if text.endswith("Z"):
            text = f"{text[:-1]}+00:00"
        try:
            dt = datetime.datetime.fromisoformat(text)
        except ValueError:
            return None

    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, _service_gateway_tzinfo())

    return timezone.localtime(dt, _service_gateway_tzinfo())


def _extract_time(event_data: Dict[str, Any]) -> Optional[int]:
    start_time = _none_if_blank(event_data.get("start_time"))
    if start_time is not None:
        parsed = _parse_datetime(start_time)
        if parsed:
            return (parsed.hour * 100) + parsed.minute
        logger.warning(
            "Unparseable start_time for work-item %s: %r",
            event_data.get("id"),
            start_time,
        )
        return None

    for key in ("scheduled_at", "time"):
        parsed = _parse_datetime(event_data.get(key))
        if parsed:
            return (parsed.hour * 100) + parsed.minute

    return None


def _build_event_contact(event_data: Dict[str, Any]) -> Any:
    raw_contact = event_data.get("contact")
    if isinstance(raw_contact, dict):
        return [_normalize_contact_item(raw_contact)]

    if isinstance(raw_contact, list):
        contacts = [_normalize_contact_item(item) for item in raw_contact if isinstance(item, dict)]
        return contacts if contacts else None

    assignees = event_data.get("assignees")
    if isinstance(assignees, list):
        for assignee in assignees:
            if not isinstance(assignee, dict):
                continue
            return [_normalize_contact_item(assignee)]

    return None


def _build_event_venue(event_data: Dict[str, Any]) -> Any:
    raw_venue = event_data.get("venue")
    if isinstance(raw_venue, dict):
        location = _string_field(_pick_first(raw_venue, "location", "address", "street_address", "city_address"))
        venue_type = _string_field(_pick_first(raw_venue, "type", "venue_type"))
        if location is None and venue_type is None:
            return None
        return {"location": location, "type": venue_type}

    location = _pick_first(event_data, "location", "address")
    venue_type = _string_field(_pick_first(event_data, "venue_type", "type"))
    if location is None and venue_type is None:
        return None

    return {
        "location": _string_field(location),
        "type": venue_type,
    }


def _normalize_scheduled_category(event_data: Dict[str, Any]) -> str:
    category = (_string_field(event_data.get("category")) or "").strip().lower()
    if category in SCHEDULED_EVENT_CATEGORIES:
        return SCHEDULED_EVENT_CATEGORIES[category]

    labels = event_data.get("labels")
    if isinstance(labels, list):
        for label in labels:
            if not isinstance(label, dict):
                continue
            label_name = str(label.get("name", "")).strip().lower()
            if label_name in SCHEDULED_EVENT_CATEGORIES:
                return SCHEDULED_EVENT_CATEGORIES[label_name]

    return "Other"


def _build_issue_pin(event_data: Dict[str, Any]) -> Optional[str]:
    raw_issue_id = _none_if_blank(event_data.get("id"))
    source_id = str(raw_issue_id).strip().replace("-", "") if raw_issue_id is not None else ""
    if not source_id:
        return None
    return source_id[-8:].upper()


def _build_pin(event_data: Dict[str, Any], service_gateway_event_id: int) -> str:
    issue_pin = _build_issue_pin(event_data)
    if issue_pin:
        return issue_pin
    return f"PLN{service_gateway_event_id}"


def _extract_team_id(event_data: Dict[str, Any], default_team_id: int = 0) -> int:
    for key in TEAM_ID_KEYS:
        team_id = _int_field(event_data.get(key))
        if team_id and team_id > 0:
            return team_id
    return default_team_id if default_team_id > 0 else 0


def _make_event_payload(
    event_data: Dict[str, Any],
    contact: Any = None,
    venue: Any = None,
    event_date: Optional[str] = None,
    event_time: Optional[int] = None,
) -> Dict[str, Any]:
    if event_date is None:
        event_date = _extract_date(event_data)
    event_date = _align_event_date_to_session(event_date, event_data)
    if event_time is None:
        event_time = _extract_time(event_data)

    title = _string_field(_pick_first(event_data, "name", "title"))
    if venue is None:
        venue = _build_event_venue(event_data)
    if contact is None:
        contact = _build_event_contact(event_data)

    category = _string_field(event_data.get("category"))
    normalized_year = _normalize_session_year_text(event_data)

    return {
        "table": "event",
        "columns": [
            {"field": "title", "type": 1, "value": _json_safe_value(title)},
            {"field": "dt_event", "type": 4, "value": _json_safe_value(event_date)},
            {"field": "tm_event", "type": 0, "value": _json_safe_value(event_time)},
            {"field": "status", "type": 1, "value": "upcoming"},
            {"field": "type", "type": 1, "value": "scheduled"},
            {"field": "sport", "type": 1, "value": _json_safe_value(_string_field(event_data.get("sport")))},
            {"field": "level", "type": 1, "value": _json_safe_value(_string_field(event_data.get("level")))},
            {"field": "program", "type": 1, "value": _json_safe_value(_string_field(event_data.get("program")))},
            {"field": "year", "type": 1, "value": _json_safe_value(normalized_year)},
            {"field": "category", "type": 1, "value": _json_safe_value(category)},
            {"field": "venue", "type": 5, "value": _json_safe_value(venue)},
            {"field": "contact", "type": 5, "value": _json_safe_value(contact)},
        ],
    }


def _make_scheduled_event_payload(
    event_data: Dict[str, Any],
    service_gateway_event_id: int,
    default_team_id: int = 0,
    contact: Any = None,
) -> Dict[str, Any]:
    pin = _build_pin(event_data, service_gateway_event_id)
    if contact is None:
        contact = _build_event_contact(event_data)
    if contact is None:
        contact = []

    team_id = _extract_team_id(event_data, default_team_id=default_team_id)
    pin_plus = {
        "source": "plane",
        "workspace_id": _json_safe_value(event_data.get("workspace_id")),
        "project_id": _json_safe_value(event_data.get("project_id")),
        "issue_id": _json_safe_value(event_data.get("id")),
        "service_gateway_event_id": service_gateway_event_id,
        "team_id": _json_safe_value(team_id),
    }

    return {
        "table": "scheduled_event",
        "columns": [
            {"field": "event_id", "type": 0, "value": _json_safe_value(service_gateway_event_id)},
            {"field": "on_premise", "type": 3, "value": True},
            {"field": "pin", "type": 1, "value": _json_safe_value(pin)},
            {"field": "contact", "type": 5, "value": _json_safe_value(contact)},
            {"field": "category", "type": 1, "value": _json_safe_value(_normalize_scheduled_category(event_data))},
            {"field": "pin_plus", "type": 5, "value": _json_safe_value(pin_plus)},
            {"field": "team_id", "type": 0, "value": _json_safe_value(team_id)},
            {"field": "other_team", "type": 5, "value": None},
        ],
    }


def _make_force_upcoming_payload(service_gateway_event_id: int) -> Dict[str, Any]:
    return {
        "table": "event",
        "columns": [
            {"field": "status", "type": 1, "value": "upcoming"},
        ],
        "criteria": [
            {"field": "id", "type": 0, "value": _json_safe_value(service_gateway_event_id)},
        ],
    }


def _with_row_id_criteria(payload: Dict[str, Any], row_id: int) -> Dict[str, Any]:
    updated_payload = dict(payload)
    updated_payload["criteria"] = [
        {"field": "id", "type": 0, "value": _json_safe_value(row_id)},
    ]
    return updated_payload


def _make_delete_payload(table: str, row_id: int) -> Dict[str, Any]:
    return {
        "table": table,
        "criteria": [
            {"field": "id", "type": 0, "value": _json_safe_value(row_id)},
        ],
    }


def _make_scheduled_event_soft_delete_payload(row_id: int) -> Dict[str, Any]:
    tombstone_pin = f"DELETED-{row_id}-{uuid.uuid4().hex[:8].upper()}"
    return {
        "table": "scheduled_event",
        "columns": [
            {"field": "event_id", "type": 0, "value": None},
            {"field": "on_premise", "type": 3, "value": False},
            {"field": "pin", "type": 1, "value": tombstone_pin},
            {"field": "contact", "type": 5, "value": []},
            {"field": "pin_plus", "type": 5, "value": None},
        ],
        "criteria": [
            {"field": "id", "type": 0, "value": _json_safe_value(row_id)},
        ],
    }


def _extract_result_rows(response_json: Dict[str, Any]) -> list[Dict[str, Any]]:
    data = response_json.get("Gateway Response", response_json)
    if not isinstance(data, dict):
        return []

    rows: list[Dict[str, Any]] = []
    for raw_row in data.get("result", []):
        if isinstance(raw_row, dict):
            rows.append({str(key): _json_safe_value(value) for key, value in raw_row.items()})
            continue

        if not isinstance(raw_row, list):
            continue

        row: Dict[str, Any] = {}
        for column in raw_row:
            if not isinstance(column, dict):
                continue
            field_name = column.get("field")
            if not isinstance(field_name, str) or not field_name:
                continue
            row[field_name] = _json_safe_value(column.get("value"))
        if row:
            rows.append(row)

    return rows


def _gateway_error_message(response_json: Dict[str, Any]) -> Optional[str]:
    top_level_error = _none_if_blank(response_json.get("error"))
    if top_level_error is not None:
        return str(top_level_error)

    data = response_json.get("Gateway Response", response_json)
    if isinstance(data, dict):
        nested_error = _none_if_blank(data.get("error"))
        if nested_error is not None:
            return str(nested_error)

    return None


def _extract_created_id(response_json: Dict[str, Any]) -> Optional[int]:
    for row in _extract_result_rows(response_json):
        identifier = _int_field(row.get("id"))
        if identifier is not None:
            return identifier
    return None


def _safe_response_json(response: requests.Response) -> Dict[str, Any]:
    try:
        parsed = response.json()
    except ValueError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _derive_scheduled_event_api(event_api: str) -> str:
    if not event_api:
        return ""

    parsed = urlsplit(event_api.strip())
    path = parsed.path.rstrip("/")
    if path.endswith("/api/event"):
        path = f"{path[: -len('/api/event')]}/api/scheduled-event"
    elif path.endswith("/event"):
        path = f"{path[: -len('/event')]}/scheduled-event"
    else:
        return ""

    return urlunsplit((parsed.scheme, parsed.netloc, path, parsed.query, parsed.fragment))


def _unique_positive_ints(values: list[Optional[int]]) -> list[int]:
    unique_values: list[int] = []
    seen: set[int] = set()
    for value in values:
        if value is None or value <= 0 or value in seen:
            continue
        seen.add(value)
        unique_values.append(value)
    return unique_values
