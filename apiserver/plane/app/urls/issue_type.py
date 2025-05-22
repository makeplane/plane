from django.urls import path

from plane.app.views import (
    IssueTypeCustomPropertyAPIEndpoint
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/issue-type/<uuid:issue_type>/custom-properties/",
        IssueTypeCustomPropertyAPIEndpoint.as_view(),
        name="issue-type-custom-property",
    ) 
]