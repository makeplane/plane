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
