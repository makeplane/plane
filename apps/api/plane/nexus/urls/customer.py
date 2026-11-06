# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""URL routes for the customer feature group, mounted under /api/v1/."""

from django.urls import path

from plane.nexus.views.customer import (
    CustomerDetailAPIEndpoint,
    CustomerListCreateAPIEndpoint,
    CustomerPropertyDetailAPIEndpoint,
    CustomerPropertyListCreateAPIEndpoint,
    CustomerPropertyValueDetailAPIEndpoint,
    CustomerPropertyValueListAPIEndpoint,
    CustomerRequestDetailAPIEndpoint,
    CustomerRequestListCreateAPIEndpoint,
    CustomerWorkItemAPIEndpoint,
    CustomerWorkItemDetailAPIEndpoint,
)

_WS = "workspaces/<str:slug>"
_CUSTOMER = f"{_WS}/customers/<uuid:customer_id>"

urlpatterns = [
    path(
        f"{_WS}/customer-properties/",
        CustomerPropertyListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-customer-properties",
    ),
    path(
        f"{_WS}/customer-properties/<uuid:property_id>/",
        CustomerPropertyDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="nexus-customer-property-detail",
    ),
    path(
        f"{_WS}/customers/",
        CustomerListCreateAPIEndpoint.as_view(http_method_names=["get", "post", "delete"]),
        name="nexus-customers",
    ),
    path(
        f"{_CUSTOMER}/",
        CustomerDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="nexus-customer-detail",
    ),
    path(
        f"{_CUSTOMER}/issues/",
        CustomerWorkItemAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-customer-work-items",
    ),
    path(
        f"{_CUSTOMER}/issues/<uuid:issue_id>/",
        CustomerWorkItemDetailAPIEndpoint.as_view(http_method_names=["delete"]),
        name="nexus-customer-work-item-detail",
    ),
    path(
        f"{_CUSTOMER}/property-values/",
        CustomerPropertyValueListAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-customer-property-values",
    ),
    path(
        f"{_CUSTOMER}/property-values/<uuid:property_id>/",
        CustomerPropertyValueDetailAPIEndpoint.as_view(http_method_names=["get", "patch"]),
        name="nexus-customer-property-value-detail",
    ),
    path(
        f"{_CUSTOMER}/requests/",
        CustomerRequestListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="nexus-customer-requests",
    ),
    path(
        f"{_CUSTOMER}/requests/<uuid:request_id>/",
        CustomerRequestDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="nexus-customer-request-detail",
    ),
]
