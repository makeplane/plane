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

import type { TWorkspaceBaseActivity, TBaseActivityVerbs } from "../activity";
import type { TLogoProps } from "../common";
import type { TIssue } from "../issues/issue";
import type { CurrentUserPermissionState } from "../permissions/models";
import type { TStateGroups } from "../state";
import type { IUserLite } from "../users";

export type TTeamspace = {
  id: string;
  name: string;
  description_json: object | undefined;
  description_html: string | undefined;
  description_stripped: string | undefined;
  description_binary: string | undefined;
  logo_props: TLogoProps;
  lead_id: string | undefined;
  member_ids: string[] | undefined;
  project_ids: string[] | undefined;
  workspace: string;
  // timestamps
  created_at: string;
  updated_at: string;
  // user
  created_by: string;
  updated_by: string;
  _permissions: CurrentUserPermissionState;
};

export type TTeamspaceMember = {
  id: string;
  team_space: string;
  member: string;
  workspace: string;
  sort_order: number;
  // timestamps
  created_at: string;
  updated_at: string;
  // user
  created_by: string;
  updated_by: string;
};

export type TTeamspaceEntities = {
  linked_entities: {
    issues: number;
    cycles: number;
    total: number;
    projects: number;
  };
  team_entities: {
    pages: number;
    views: number;
    total: number;
  };
};

export type TCreateUpdateTeamspaceModal = {
  isOpen: boolean;
  teamspaceId: string | undefined;
};

// --------------- Teamspace Activity & Comments ---------------

export type TTeamspaceActivityFields =
  | "team_space"
  | "name"
  | "description"
  | "lead"
  | "projects"
  | "members"
  | "view"
  | "page";

export type TTeamspaceActivityVerbs = TBaseActivityVerbs;

export type TTeamspaceActivity = TWorkspaceBaseActivity<TTeamspaceActivityFields, TTeamspaceActivityVerbs>;

export type TTeamspaceActivityKeys = `${TTeamspaceActivityFields}_${TTeamspaceActivityVerbs}`;

export type TTeamspaceReaction = {
  id: string;
  reaction: string;
  actor: string;
  actor_detail: IUserLite;
};

// --------------- Teamspace Workload ---------------

export type TTeamspaceProgressSummary = {
  backlog_issues: number;
  cancelled_issues: number;
  completed_issues: number;
  pending_issues: number;
  overdue_issues: number;
  no_due_date_issues: number;
};

// --------------- Teamspace Dependencies ---------------

export type TIssueLite = Pick<
  TIssue,
  "id" | "name" | "type_id" | "sequence_id" | "project_id" | "priority" | "archived_at"
> & { state__group: TStateGroups };

export type TTeamspaceDependencyWorkItem = TIssueLite & {
  related_issues: TIssueLite[];
  related_assignee_ids: string[];
};

export type TTeamspaceRelations = {
  blocking_issues: TTeamspaceDependencyWorkItem[];
  blocked_by_issues: TTeamspaceDependencyWorkItem[];
};

// --------------- Teamspace Statistics ---------------

export type TTeamspaceStatistics = {
  identifier: string;
  count: number;
}[];
