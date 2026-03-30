# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.urls import path

from plane.app.views.ho import HoCategorySummaryView, HoIssueListView, HoAccessibleWorkspacesView

urlpatterns = [
    path("ho/issues/", HoIssueListView.as_view(), name="ho-issues"),
    path("ho/category-summary/", HoCategorySummaryView.as_view(), name="ho-category-summary"),
    path("ho/workspaces/", HoAccessibleWorkspacesView.as_view(), name="ho-workspaces"),
]
