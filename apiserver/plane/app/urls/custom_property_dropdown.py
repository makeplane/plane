from django.urls import path
from plane.app.views import (
    IssueCustomPropertyDropdownOptionsAPIView,
)

urlpatterns = [
    path(
        'workspaces/<str:slug>/issues/<uuid:issue_id>/custom-properties/<uuid:issue_type_custom_property_id>/dropdown-options/',
        IssueCustomPropertyDropdownOptionsAPIView.as_view(),
        name="custom-property-dropdown-options",
    ),
]
