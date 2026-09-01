# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): pure spreadsheet-parsing
# helpers for Phase 3 of the custom-fields roadmap (historical Excel data import).
# Deliberately has no Django import: apps/api/plane/db/management/commands/
# import_historical_project_data.py is the only caller and owns everything that
# touches the database (Project/ProjectCustomField creation, uniqueness checks).
# Keeping this module Django-free lets its parsing/coercion logic be unit-tested
# without a database, and lets it be exercised directly against a real workbook
# outside manage.py for one-off verification.
#
# field_specs is always the caller-supplied list of dicts shaped like
# DEFAULT_PROJECT_CUSTOM_FIELDS entries (apps/api/plane/db/default_data/
# project_custom_fields.py): {"name": str, "field_type": str, "options": list[str]
# (dropdown only)}. Passed in rather than imported so this module never needs to
# know where that list lives.

# Python imports
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

_FORBIDDEN_NAME_CHARS = set("&+,:;$^}{*=?@#|'<>.()%!-")


def sanitize_project_text(raw, max_length=255):
    """
    Strips the same characters Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN rejects
    (see apps/api/plane/db/models/project.py) so a value lifted from the
    spreadsheet can be used as a Project name without failing ProjectSerializer's
    validate_name. Returns None for blank/whitespace-only/all-forbidden input.
    """
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    cleaned = "".join(ch for ch in text if ch not in _FORBIDDEN_NAME_CHARS).strip()
    cleaned = cleaned[:max_length].strip()
    return cleaned or None


def is_row_blank(raw_values):
    """True when every cell in the row (already-read raw values) is empty."""
    return all(value is None or (isinstance(value, str) and value.strip() == "") for value in raw_values)


def coerce_text(raw):
    if raw is None:
        return None, None
    text = str(raw).strip()
    return (text or None), None


def coerce_number(raw, number_format, is_percent=False):
    """
    Excel stores a percent-formatted cell as a fraction (13% -> 0.13 in the
    underlying value); a field explicitly marked is_percent expects the
    human-visible number (13, not 0.13), so a "%" in the cell's number_format
    multiplies back up -- but ONLY for such a field. A field not marked
    is_percent (e.g. a money amount) that happens to carry percent formatting
    anyway (a source-spreadsheet formatting slip, plausible in a manually
    maintained multi-year file) is deliberately NOT auto-multiplied: guessing
    wrong would silently corrupt a financial figure with no way to notice. It's
    surfaced as a warning instead, left for a human to check against the source
    cell. DecimalField (not float) throughout to avoid binary rounding error on
    figures that get summed, matching ProjectCustomFieldValue.value_decimal.
    """
    if raw is None or raw == "":
        return None, None
    if isinstance(raw, bool):
        return None, f"unexpected boolean value: {raw!r}"
    if isinstance(raw, (int, float, Decimal)):
        value = Decimal(str(raw))
    else:
        cleaned = str(raw).strip().replace(",", "")
        had_percent_sign = cleaned.endswith("%")
        cleaned = cleaned.rstrip("%").strip()
        if not cleaned:
            return None, None
        try:
            value = Decimal(cleaned)
        except InvalidOperation:
            return None, f"unparseable number: {raw!r}"
        if had_percent_sign:
            # A literal "13%" string is already the human-visible number: an
            # explicit signal from the data itself, unlike number_format metadata,
            # so this one applies regardless of is_percent. Do not also apply the
            # number_format multiplier below, or it would become 1300.
            return value, None
    is_percent_formatted = bool(number_format and "%" in number_format)
    if is_percent_formatted and is_percent:
        value = value * 100
    elif is_percent_formatted and not is_percent:
        return value, (
            f"cell is percent-formatted ({number_format!r}) but this field is not marked "
            f"is_percent; used the raw value {value} as-is instead of guessing whether to "
            "multiply by 100 -- verify against the source cell"
        )
    return value, None


_DATE_FORMATS = ("%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d", "%Y年%m月%d日")


def coerce_date(raw):
    if raw is None or raw == "":
        return None, None
    if isinstance(raw, datetime):
        return raw.date(), None
    if isinstance(raw, date):
        return raw, None
    text = str(raw).strip()
    if not text:
        return None, None
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date(), None
        except ValueError:
            continue
    return None, f"unparseable date: {raw!r}"


def coerce_dropdown(raw, options):
    if raw is None:
        return None, None
    text = str(raw).strip()
    if not text:
        return None, None
    if text not in options:
        return None, f"value {text!r} does not match any of this field's seeded options {options!r}"
    return text, None


def coerce_cell(field_type, raw, number_format=None, options=None, is_percent=False):
    if field_type == "text":
        return coerce_text(raw)
    if field_type == "number":
        return coerce_number(raw, number_format, is_percent=is_percent)
    if field_type == "date":
        return coerce_date(raw)
    if field_type == "dropdown":
        return coerce_dropdown(raw, options or [])
    return None, f"unsupported field_type {field_type!r}"


def parse_row(ws, row_idx, field_specs):
    """
    Reads columns 1..len(field_specs) (A.. for a 23-entry field_specs, that's A-W)
    of one worksheet row and coerces each cell per its field_specs entry's
    field_type. Never queries or writes a database; purely reads the worksheet.

    Returns (raw_values, coerced, warnings):
    - raw_values: the untouched cell values, in column order (caller can pass this
      straight to is_row_blank).
    - coerced: {field_name: typed value or None}.
    - warnings: human-readable strings for cells that had content but could not be
      coerced (unparseable number/date, unmatched dropdown option); the field is
      left as None in coerced rather than aborting the row.
    """
    raw_values = []
    coerced = {}
    warnings = []
    for col_index, spec in enumerate(field_specs, start=1):
        cell = ws.cell(row=row_idx, column=col_index)
        raw_values.append(cell.value)
        value, warning = coerce_cell(
            spec["field_type"],
            cell.value,
            number_format=cell.number_format,
            options=spec.get("options"),
            is_percent=spec.get("is_percent", False),
        )
        coerced[spec["name"]] = value
        if warning:
            warnings.append(f"{spec['name']}: {warning}")
    return raw_values, coerced, warnings


def validate_headers(ws, header_row, field_specs):
    """
    Returns a list of mismatch descriptions (empty means the header row lines up
    exactly, in order, with field_specs). Column letters are derived assuming
    field_specs has at most 26 entries (chr(64 + position) stays within A-Z).

    Matches against spec["source_header"] when present, spec["name"] otherwise:
    a field's display name (shown in the Plane UI) can carry a unit hint the
    source spreadsheet's literal column header doesn't have -- see
    DEFAULT_PROJECT_CUSTOM_FIELDS's module docstring for why "税率（%）" and
    "合同占比（%）" need this.
    """
    mismatches = []
    for position, spec in enumerate(field_specs, start=1):
        actual = ws.cell(row=header_row, column=position).value
        actual = (actual or "").strip() if isinstance(actual, str) else actual
        expected = spec.get("source_header", spec["name"])
        if actual != expected:
            column_letter = chr(64 + position) if position <= 26 else f"#{position}"
            mismatches.append(f"column {column_letter}: expected {expected!r}, got {actual!r}")
    return mismatches
