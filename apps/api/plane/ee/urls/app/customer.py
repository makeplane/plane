# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.customer import (
    CustomerEndpoint,
    CustomerPropertyEndpoint,
    CustomerPropertyOptionEndpoint,
    CustomerRequestEndpoint,
    CustomerIssuesEndpoint,
    CustomerPropertyValueEndpoint,
    CustomerIssueSearchEndpoint,
    CustomerRequestAttachmentV2Endpoint,
    IssueCustomerEndpoint,
    IssueCustomerRequestEndpoint,
)

urlpatterns = [
    # Customer
    path(
        "workspaces/<str:slug>/customers/", CustomerEndpoint.as_view(), name="customer"
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:pk>/",
        CustomerEndpoint.as_view(),
        name="customer",
    ),
    # End customer
    # Customer property
    path(
        "workspaces/<str:slug>/customer-properties/",
        CustomerPropertyEndpoint.as_view(),
        name="customer-properties",
    ),
    path(
        "workspaces/<str:slug>/customer-properties/<uuid:pk>/",
        CustomerPropertyEndpoint.as_view(),
        name="customer-properties",
    ),
    # End customer property
    # Customer property option
    path(
        "workspaces/<str:slug>/customer-property-options/",
        CustomerPropertyOptionEndpoint.as_view(),
        name="customer-properties-options",
    ),
    # End customer property option
    # Customer request
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/customer-requests/",
        CustomerRequestEndpoint.as_view(),
        name="customer-requests",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/customer-requests/<uuid:pk>/",
        CustomerRequestEndpoint.as_view(),
        name="customer-requests",
    ),
    # End customer request
    # Customer issue
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/work-items/",
        CustomerIssuesEndpoint.as_view(),
        name="customer-work-items",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/work-items/<uuid:work_item_id>/",
        CustomerIssuesEndpoint.as_view(),
        name="customer-work-items",
    ),
    # End customer issue
    # Customer of work items
    path(
        "workspaces/<str:slug>/work-items/<uuid:work_item_id>/customers/",
        IssueCustomerEndpoint.as_view(),
        name="issue-customers",
    ),
    path(
        "workspaces/<str:slug>/work-items/<uuid:work_item_id>/customer-requests/",
        IssueCustomerRequestEndpoint.as_view(),
        name="issue-customers",
    ),
    # End customers of work items
    # Customer property values
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/values/",
        CustomerPropertyValueEndpoint.as_view(),
        name="customer-property-values",
    ),
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/customer-properties/<uuid:property_id>/values/",
        CustomerPropertyValueEndpoint.as_view(),
        name="customer-property-values",
    ),
    # End customer property values
    # Issue Search
    path(
        "workspaces/<str:slug>/customers/<uuid:customer_id>/search-work-items/",
        CustomerIssueSearchEndpoint.as_view(),
        name="customer-issue-search",
    ),
    # End issue search
    # customer request attachments
    path(
        "assets/v2/workspaces/<str:slug>/customer-requests/attachments/",
        CustomerRequestAttachmentV2Endpoint.as_view(),
        name="customer-request-attachments",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/customer-requests/<uuid:customer_request_id>/attachments/",
        CustomerRequestAttachmentV2Endpoint.as_view(),
        name="customer-request-details",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/customer-requests/<uuid:customer_request_id>/attachments/<uuid:pk>/",
        CustomerRequestAttachmentV2Endpoint.as_view(),
        name="customer-request-details",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/customer-requests/attachments/<uuid:pk>/",
        CustomerRequestAttachmentV2Endpoint.as_view(),
        name="customer-request-details",
    ),
    # End customer request attachments
]
