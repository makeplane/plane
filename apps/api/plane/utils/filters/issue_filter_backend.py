import json
import re

from django.db.models import Q

from plane.db.models import IssueProperty, IssuePropertyValue
from plane.utils.filters.filter_backend import ComplexFilterBackend

CUSTOM_PROPERTY_FILTER_PATTERN = re.compile(
    r"^customproperty_(?P<property_id>[0-9a-f-]{36})__(?P<lookup>exact|in|isnull|range)$",
    re.IGNORECASE,
)


def _parse_bool(value):
    if value in (True, "true", "True", 1, "1"):
        return True
    if value in (False, "false", "False", 0, "0"):
        return False
    return None


def _parse_filter_values(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        if "," in value:
            return [part.strip() for part in value.split(",") if part.strip()]
        return [value]
    return [value]


class IssueComplexFilterBackend(ComplexFilterBackend):
    """
    Complex filter backend for issues that supports custom property filters.

    Filter keys use the format: customproperty_<property-uuid>__<lookup>
    where lookup is one of: exact, in, isnull, range (date only).
    """

    def _transform_field_name_for_validation(self, field_name):
        if CUSTOM_PROPERTY_FILTER_PATTERN.match(field_name):
            return field_name
        return super()._transform_field_name_for_validation(field_name)

    def _validate_fields(self, filter_data, view):
        from rest_framework.exceptions import ValidationError as DRFValidationError

        filterset_class = getattr(view, "filterset_class", None)
        allowed_fields = set(filterset_class.base_filters.keys()) if filterset_class else None
        if not allowed_fields:
            raise DRFValidationError(
                {
                    "message": ("Filtering is not enabled for this endpoint (missing filterset_class)"),
                    "code": "filtering_not_enabled",
                }
            )

        fields = self._extract_field_names(filter_data)
        project_id = view.kwargs.get("project_id")

        for field in fields:
            match = CUSTOM_PROPERTY_FILTER_PATTERN.match(field)
            if match:
                self._validate_custom_property_field(match.group("property_id"), project_id)
                continue
            if field not in allowed_fields:
                raise DRFValidationError(
                    {
                        "message": f"Filtering on field '{field}' is not allowed",
                        "code": "invalid_filter_field",
                    }
                )

    def _validate_custom_property_field(self, property_id, project_id):
        from rest_framework.exceptions import ValidationError as DRFValidationError

        if not project_id:
            raise DRFValidationError(
                {
                    "message": "Custom property filters require a project context",
                    "code": "invalid_filter_field",
                }
            )

        exists = IssueProperty.objects.filter(
            id=property_id,
            project_id=project_id,
            deleted_at__isnull=True,
            is_active=True,
        ).exists()
        if not exists:
            raise DRFValidationError(
                {
                    "message": f"Custom property '{property_id}' is not valid for this project",
                    "code": "invalid_filter_field",
                }
            )

    def _build_leaf_q(self, leaf_conditions, view, queryset):
        if not leaf_conditions:
            return Q()

        custom_conditions = {}
        standard_conditions = {}

        for key, value in leaf_conditions.items():
            if CUSTOM_PROPERTY_FILTER_PATTERN.match(key):
                custom_conditions[key] = value
            else:
                standard_conditions[key] = value

        combined_q = Q()

        if standard_conditions:
            combined_q &= super()._build_leaf_q(standard_conditions, view, queryset)

        if custom_conditions:
            combined_q &= self._build_custom_property_q(custom_conditions, view)

        return combined_q

    def _build_custom_property_q(self, conditions, view):
        project_id = view.kwargs.get("project_id")
        combined_q = Q()

        for key, raw_value in conditions.items():
            match = CUSTOM_PROPERTY_FILTER_PATTERN.match(key)
            if not match:
                continue

            property_id = match.group("property_id")
            lookup = match.group("lookup").lower()

            base = Q(
                property_values__property_id=property_id,
                property_values__deleted_at__isnull=True,
                property_values__property__deleted_at__isnull=True,
                property_values__property__is_active=True,
            )

            if project_id:
                base &= Q(property_values__property__project_id=project_id)

            if lookup == "isnull":
                is_null = _parse_bool(raw_value)
                if is_null is True:
                    combined_q &= ~Q(
                        property_values__property_id=property_id,
                        property_values__deleted_at__isnull=True,
                        property_values__value__isnull=False,
                    )
                else:
                    combined_q &= base & Q(property_values__value__isnull=False)
                continue

            if lookup == "range":
                range_values = _parse_filter_values(raw_value)
                if len(range_values) != 2:
                    continue
                combined_q &= base & Q(
                    property_values__value__gte=range_values[0],
                    property_values__value__lte=range_values[1],
                )
                continue

            values = _parse_filter_values(raw_value)
            if not values:
                continue

            value_q = Q()
            for value in values:
                parsed_value = self._coerce_json_value(value)
                if lookup == "in":
                    value_q |= base & (
                        Q(property_values__value=parsed_value)
                        | Q(property_values__value__contains=[parsed_value])
                    )
                else:
                    value_q |= base & Q(property_values__value=parsed_value)

            combined_q &= value_q

        return combined_q

    @staticmethod
    def _coerce_json_value(value):
        if not isinstance(value, str):
            return value
        lowered = value.lower()
        if lowered == "true":
            return True
        if lowered == "false":
            return False
        try:
            if "." in value:
                return float(value)
            return int(value)
        except ValueError:
            pass
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
