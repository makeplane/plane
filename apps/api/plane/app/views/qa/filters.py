# filters.py
from django_filters import rest_framework as filters

from plane.db.models import TestPlan


class TestPlanFilter(filters.FilterSet):
    assignee_display_name = filters.CharFilter(field_name='assignees__display_name', lookup_expr='icontains')

    class Meta:
        model = TestPlan
        fields = {
            'name': ['exact', 'icontains', 'in'],
            'id': ['exact', 'in'],
            'state': ['in'],
            'repository_id': ['exact'],
            'module_id': ['exact'],
        }
