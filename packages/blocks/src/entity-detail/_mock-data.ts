/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// Shared mock data for work-item-detail stories.
// NOT exported from the package barrel — internal to stories only.

export const MOCK_PROJECT = {
  name: "ACME Platform",
  identifier: "ACME",
};

export const MOCK_WORK_ITEM = {
  sequenceId: 202,
  identifier: "ACME-202",
  title: "Implement OAuth2 integration with third-party identity providers",
  parentTitle: "Authentication & SSO epic",
};

export const MOCK_STATE = {
  label: "In Progress",
  color: "#f59e0b",
};

export const MOCK_PRIORITY = {
  label: "High",
};

export const MOCK_ASSIGNEES = [
  { id: "a1", name: "Amanda Chen", avatarUrl: undefined, fallbackColor: "#6366f1" },
  { id: "a2", name: "Matt Thompson", avatarUrl: undefined, fallbackColor: "#f59e0b" },
];

export const MOCK_DATES = {
  startDate: "Mar 11, 2026",
  dueDate: "Mar 25, 2026",
};

export const MOCK_LABELS = [
  { id: "l1", name: "Design", color: "#8b5cf6" },
  { id: "l2", name: "Bugs", color: "#ef4444" },
  { id: "l3", name: "Improvement", color: "#10b981" },
  { id: "l4", name: "Features", color: "#3b82f6" },
];

export const MOCK_VOTES = {
  upVotesCount: 3,
  downVotesCount: 1,
  isUpVotedByUser: true,
  isDownVotedByUser: false,
};

export const MOCK_VOTERS = {
  upVotes: [
    { id: "u1", displayName: "Amanda Chen", avatarUrl: undefined },
    { id: "u2", displayName: "Matt Thompson", avatarUrl: undefined },
    { id: "u3", displayName: "Sarah Kim", avatarUrl: undefined },
  ],
  downVotes: [{ id: "d1", displayName: "Dave Wilson", avatarUrl: undefined }],
};

export const MOCK_LAST_EDITED = {
  name: "Matt Thompson",
  timeAgo: "1d ago",
};

export const MOCK_WIDGET_SECTIONS = [
  { title: "Sub-work items", count: 4 },
  { title: "Dependencies", count: 2 },
  { title: "Relations", count: 1 },
  { title: "Links", count: 3 },
  { title: "Attachments", count: 2 },
] as const;

export const MOCK_ACTIVITY_TABS = [
  { key: "all", label: "All" },
  { key: "activity", label: "Activity" },
  { key: "comment", label: "Comment" },
  { key: "worklog", label: "Worklog" },
  { key: "transition", label: "Transition" },
  { key: "history", label: "History" },
] as const;

export const MOCK_TIMELINE = {
  created: {
    user: "Amanda Chen",
    action: "created this work item",
    timeAgo: "5d ago",
  },
  stateChange: {
    user: "Matt Thompson",
    action: 'changed the state from "Todo" to "In Progress"',
    timeAgo: "3d ago",
  },
  comment: {
    user: "Sarah Kim",
    timeAgo: "2d ago",
    text: "I reviewed the initial implementation and it looks solid. We should make sure to handle the token refresh flow gracefully — the current approach might cause a brief interruption for users when tokens expire during active sessions.",
  },
};

export const MOCK_SIDEBAR = {
  estimate: "6",
  trackedTime: "2h 32m",
  cycle: "Sprint 14",
  module: "Auth Module",
};

export const MOCK_AUDIT = {
  createdBy: "Amanda Chen",
  createdOn: "11 Mar, 2026 9:45 PM",
  updatedOn: "12 Mar, 2026 8:23 AM",
  completedOn: "16 Mar, 2026 12:45 PM",
};

export const MOCK_DESCRIPTION =
  "We need to implement a flexible OAuth2 integration layer that supports multiple identity providers including Google, GitHub, and Azure AD. The implementation should handle token exchange, refresh flows, and session management. Key requirements include support for PKCE, configurable scopes per provider, and a fallback mechanism when the primary IdP is unavailable.";
