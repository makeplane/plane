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

import type { FC } from "react";
import type { ISvgIcons } from "@plane/propel/icons";
import type { TGettingStartedChecklistKeys } from "@plane/types";
import {
  AsanaIcon,
  ClickupIcon,
  GithubIcon,
  GitlabIcon,
  JiraIcon,
  LinearIcon,
  MondayIcon,
  RaycastIcon,
  SentryIcon,
  SlackIcon,
} from "@plane/propel/icons";

// Integration types
export type TIntegration = {
  readonly title: string;
  readonly icon: FC<ISvgIcons>;
};

export const INTEGRATIONS: readonly TIntegration[] = [
  { title: "GitHub", icon: GithubIcon },
  { title: "GitLab", icon: GitlabIcon },
  { title: "Slack", icon: SlackIcon },
  { title: "Sentry", icon: SentryIcon },
  { title: "Raycast", icon: RaycastIcon },
  { title: "Jira", icon: JiraIcon },
] as const;

// Comparison page types
export type TPlaneComparePage = {
  readonly title: string;
  readonly icon: FC<ISvgIcons>;
  readonly href: string;
};

export const PLANE_COMPARE_PAGES: readonly TPlaneComparePage[] = [
  { title: "Linear", icon: LinearIcon, href: "https://plane.so/plane-vs-linear" },
  { title: "Jira", icon: JiraIcon, href: "https://plane.so/plane-vs-jira" },
  { title: "Asana", icon: AsanaIcon, href: "https://plane.so/plane-vs-asana" },
  { title: "Monday", icon: MondayIcon, href: "https://plane.so/plane-vs-monday" },
  { title: "Clickup", icon: ClickupIcon, href: "https://plane.so/plane-vs-clickup" },
] as const;

// Checklist types
export type TChecklistItem = {
  readonly id: TGettingStartedChecklistKeys;
  readonly label: string;
};

export const ADMIN_USER_CHECKLIST: TChecklistItem[] = [
  { id: "project_created", label: "Create a project" },
  { id: "work_item_created", label: "Create a work item" },
  { id: "team_members_invited", label: "Invite team members" },
  { id: "page_created", label: "Try creating a page" },
  { id: "ai_chat_tried", label: "Try Plane AI chat" },
  { id: "integration_linked", label: "Link an integration" },
];

export const MEMBER_USER_CHECKLIST: TChecklistItem[] = [
  { id: "project_joined", label: "Join a project" },
  { id: "work_item_created", label: "Create a work item" },
  { id: "ai_chat_tried", label: "Try Plane AI chat" },
  { id: "page_created", label: "Try creating a page" },
  { id: "view_created", label: "Create a view" },
  { id: "sticky_created", label: "Create a sticky" },
];
