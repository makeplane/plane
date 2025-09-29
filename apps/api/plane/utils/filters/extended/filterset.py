from django_filters import filters

from plane.ee.models import Initiative

from ..filterset import BaseFilterSet, IssueFilterSet, UUIDInFilter


class ExtendedIssueFilterSet(IssueFilterSet):
    team_project_id = filters.UUIDFilter(field_name="project_id")
    team_project_id__in = UUIDInFilter(field_name="project_id", lookup_expr="in")

    type_id = filters.UUIDFilter(field_name="type_id")
    type_id__in = UUIDInFilter(field_name="type_id", lookup_expr="in")

    class Meta(IssueFilterSet.Meta):
        fields = IssueFilterSet.Meta.fields
        fields.update(
            {
                "start_date": ["exact", "gte", "gt", "lte", "lt", "range"],
                "target_date": ["exact", "gte", "gt", "lte", "lt", "range"],
                "created_at": ["exact", "gte", "gt", "lte", "lt", "range"],
            }
        )


class InitiativeFilterSet(BaseFilterSet):
    lead = filters.UUIDFilter(field_name="lead")
    lead__in = UUIDInFilter(field_name="lead", lookup_expr="in")

    class Meta:
        model = Initiative
        fields = {
            "start_date": ["exact", "gte", "gt", "lte", "lt", "range"],
            "end_date": ["exact", "gte", "gt", "lte", "lt", "range"],
            "state": ["exact", "in"],
        }
