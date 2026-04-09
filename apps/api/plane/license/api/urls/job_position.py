# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.license.api.views.job_position import (
    InstanceJobPositionEndpoint,
    InstanceJobPositionDetailEndpoint,
    InstanceJobGradeEndpoint,
    InstanceJobGradeDetailEndpoint,
)
from plane.license.api.views.job_position_bulk_import import JobPositionBulkImportView

urlpatterns = [
    path(
        "job-positions/bulk-import/",
        JobPositionBulkImportView.as_view(http_method_names=["post"]),
        name="instance-job-position-bulk-import",
    ),
    path(
        "job-positions/",
        InstanceJobPositionEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-job-positions",
    ),
    # grades/ must come before <uuid:pk>/ to avoid UUID capture conflict
    path(
        "job-positions/grades/",
        InstanceJobGradeEndpoint.as_view(http_method_names=["get", "post"]),
        name="instance-job-grades",
    ),
    path(
        "job-positions/grades/<uuid:pk>/",
        InstanceJobGradeDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="instance-job-grade-detail",
    ),
    path(
        "job-positions/<uuid:pk>/",
        InstanceJobPositionDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="instance-job-position-detail",
    ),
]
