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

from django.urls import path
from ..views.app import (
    ScriptListCreateView,
    ScriptRetrieveUpdateDestroyView,
    ScriptTestView,
    ExecutionListView,
    ExecutionRetrieveView,
    ScriptExecutionListView,
    ScriptStatsView,
    FunctionListCreateView,
    FunctionRetrieveUpdateDestroyView,
)

urlpatterns = [
    # Test endpoint (no script_id required)
    path(
        "workspaces/<str:slug>/runnerctl/test/",
        ScriptTestView.as_view(),
        name="script-test"
    ),
    # Script endpoints
    path(
        "workspaces/<str:slug>/runnerctl/scripts/",
        ScriptListCreateView.as_view(),
        name="script-list-create"
    ),
    path(
        "workspaces/<str:slug>/runnerctl/scripts/<uuid:script_id>/",
        ScriptRetrieveUpdateDestroyView.as_view(),
        name="script-retrieve-update-destroy"
    ),
    path(
        "workspaces/<str:slug>/runnerctl/scripts/<uuid:script_id>/stats/",
        ScriptStatsView.as_view(),
        name="script-stats"
    ),
    # Script-specific executions list
    path(
        "workspaces/<str:slug>/runnerctl/scripts/<uuid:script_id>/executions/",
        ScriptExecutionListView.as_view(),
        name="script-execution-list"
    ),
    # All executions endpoints (works for both test and script runs)
    path(
        "workspaces/<str:slug>/runnerctl/executions/",
        ExecutionListView.as_view(),
        name="execution-list"
    ),
    path(
        "workspaces/<str:slug>/runnerctl/executions/<uuid:execution_id>/",
        ExecutionRetrieveView.as_view(),
        name="execution-retrieve"
    ),
    # Function endpoints
    path(
        "workspaces/<str:slug>/runnerctl/functions/",
        FunctionListCreateView.as_view(),
        name="function-list-create"
    ),
    path(
        "workspaces/<str:slug>/runnerctl/functions/<uuid:function_id>/",
        FunctionRetrieveUpdateDestroyView.as_view(),
        name="function-retrieve-update-destroy"
    ),
]
