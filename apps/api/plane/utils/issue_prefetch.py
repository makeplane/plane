from typing import Any
from uuid import UUID

from django.db.models import Prefetch

from plane.db.models import IssuePropertyValue


def prefetch_issue_custom_field_values(queryset):
    """Prefetch custom field values for issue list serializers."""
    return queryset.prefetch_related(
        Prefetch(
            "property_values",
            queryset=IssuePropertyValue.objects.filter(deleted_at__isnull=True).select_related("property"),
        )
    )


def _issue_id_key(issue_id: UUID | str) -> str:
    return str(issue_id)


def build_custom_fields_by_issue_id(issue_ids: list[UUID | str]) -> dict[str, dict[str, Any]]:
    """Batch-load custom field values keyed by issue id (string) then property key."""
    if not issue_ids:
        return {}

    property_values = IssuePropertyValue.objects.filter(
        issue_id__in=issue_ids,
        deleted_at__isnull=True,
        property__deleted_at__isnull=True,
        property__is_active=True,
    ).select_related("property")

    custom_fields_by_issue: dict[str, dict[str, Any]] = {}
    for pv in property_values:
        if not pv.property:
            continue
        custom_fields_by_issue.setdefault(_issue_id_key(pv.issue_id), {})[pv.property.key] = pv.value

    return custom_fields_by_issue


def attach_custom_fields_to_issue_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Attach custom_fields dicts to issue list payloads built via queryset.values()."""
    if not results:
        return results

    custom_fields_by_issue = build_custom_fields_by_issue_id([result["id"] for result in results])
    for result in results:
        result["custom_fields"] = custom_fields_by_issue.get(_issue_id_key(result["id"]), {})

    return results


def custom_fields_from_issue(instance) -> dict[str, Any]:
    """Read custom field values from an issue instance (uses prefetch when available)."""
    custom_fields: dict[str, Any] = {}
    prefetched = getattr(instance, "_prefetched_objects_cache", None)
    if prefetched is not None and "property_values" in prefetched:
        property_values = instance.property_values.all()
    else:
        property_values = IssuePropertyValue.objects.filter(
            issue_id=instance.id,
            deleted_at__isnull=True,
            property__deleted_at__isnull=True,
            property__is_active=True,
        ).select_related("property")

    for pv in property_values:
        if pv.deleted_at is not None:
            continue
        if pv.property and pv.property.deleted_at is None and pv.property.is_active:
            custom_fields[pv.property.key] = pv.value

    return custom_fields
