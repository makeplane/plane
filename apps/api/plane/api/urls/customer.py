from django.urls import path

from plane.api.views import (
    CustomerAPIEndpoint,
    CustomerDetailAPIEndpoint,
    CustomerRequestAPIEndpoint,
    CustomerRequestDetailAPIEndpoint,
    CustomerIssuesAPIEndpoint,
    CustomerIssueDetailAPIEndpoint,
    CustomerPropertiesAPIEndpoint,
    CustomerPropertyDetailAPIEndpoint,
    CustomerPropertyValuesAPIEndpoint,
    CustomerPropertyValueDetailAPIEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/customers/",
        CustomerAPIEndpoint.as_view(),
        name="customer",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:pk>/",
        CustomerDetailAPIEndpoint.as_view(),
        name="customer-detail",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/requests/",
        CustomerRequestAPIEndpoint.as_view(),
        name="customer-requests",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/requests/<uuid:pk>/",
        CustomerRequestDetailAPIEndpoint.as_view(),
        name="customer-requests-detail",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/issues/",
        CustomerIssuesAPIEndpoint.as_view(),
        name="customer-issues",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/issues/<uuid:issue_id>/",
        CustomerIssueDetailAPIEndpoint.as_view(),
        name="customer-issues-detail",
    ),
    path(
        "workspaces/<str:slug>/customer-properties/",
        CustomerPropertiesAPIEndpoint.as_view(),
        name="customer-properties",
    ),
    path(
        "workspaces/<str:slug>/customer-properties/<uuid:pk>/",
        CustomerPropertyDetailAPIEndpoint.as_view(),
        name="customer-properties-detail",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/property-values/",
        CustomerPropertyValuesAPIEndpoint.as_view(),
        name="customer-property-values",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/property-values/<uuid:property_id>/",
        CustomerPropertyValueDetailAPIEndpoint.as_view(),
        name="customer-property-values-detail",
    ),
]
