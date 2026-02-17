# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.urls import path

# Module imports
from plane.silo.views import ImportExecutionLogAPIView, ImportJobSummaryAPIView

# Report endpoints
urlpatterns = [
    path(
        "execution-logs/jobs/<uuid:job_id>/reports/<uuid:report_id>/execution-logs/",
        ImportExecutionLogAPIView.as_view(),
        name="import-execution-log",
    ),
    path(
        "jobs/<uuid:job_id>/reports/<uuid:report_id>/trigger-summary-generation/",
        ImportJobSummaryAPIView.as_view(),
        name="import-job-summary",
    ),
]
