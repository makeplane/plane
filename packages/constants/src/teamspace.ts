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

export enum ETeamspaceScope {
  YOUR_TEAMS = "your-teams",
  ALL_TEAMS = "all-teams",
}

export enum ETeamspaceNavigationItem {
  OVERVIEW = "overview",
  ISSUES = "issues",
  CYCLES = "cycles",
  VIEWS = "views",
  PAGES = "pages",
  PROJECTS = "projects",
}

export enum ETeamspaceAnalyticsDataKeys {
  PROJECTS = "projects",
  MEMBERS = "members",
}

export enum ETeamspaceAnalyticsValueKeys {
  ISSUES = "issues",
  // POINTS = "points",
}

export enum EProgressXAxisKeys {
  TARGET_DATE = "target_date",
  START_DATE = "start_date",
  PRIORITY = "priority",
}

export enum EProgressDataKeys {
  COMPLETED = "completed",
  PENDING = "pending",
  OVERDUE = "overdue",
}

export enum ERelationType {
  BLOCKING = "blocking",
  BLOCKED_BY = "blocked_by",
}

export enum EStatisticsLegend {
  STATE = "state",
  PRIORITY = "priority",
}
