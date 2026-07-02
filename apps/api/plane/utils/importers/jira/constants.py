# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

JIRA_EXTERNAL_SOURCE = "jira"
JIRA_TESTCASE_LABEL = "jira-rtm-test-case"
DEFAULT_ISSUE_TYPE_NAME = "Test Case"
SEARCH_PAGE_SIZE = 50

ISSUE_FIELDS = [
    "summary",
    "description",
    "status",
    "priority",
    "assignee",
    "reporter",
    "labels",
    "components",
    "issuetype",
    "created",
    "updated",
    "comment",
]

JIRA_STATUS_CATEGORY_TO_STATE_GROUP = {
    "new": "unstarted",
    "indeterminate": "started",
    "done": "completed",
}

JIRA_PRIORITY_TO_PLANE = {
    "highest": "urgent",
    "high": "high",
    "medium": "medium",
    "low": "low",
    "lowest": "low",
}
