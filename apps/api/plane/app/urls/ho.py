# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.urls import path

from plane.app.views.ho import (
    HoCategorySummaryView,
    HoIssueListView,
    HoIssueWorklogBreakdownView,
    HoAccessibleWorkspacesView,
    HoFilterOptionsView,
)

urlpatterns = [
    path("ho/issues/", HoIssueListView.as_view(), name="ho-issues"),
    path("ho/issues/<str:issue_id>/worklogs/", HoIssueWorklogBreakdownView.as_view(), name="ho-issue-worklogs"),
    path("ho/category-summary/", HoCategorySummaryView.as_view(), name="ho-category-summary"),
    path("ho/workspaces/", HoAccessibleWorkspacesView.as_view(), name="ho-workspaces"),
    path("ho/filter-options/", HoFilterOptionsView.as_view(), name="ho-filter-options"),
]
