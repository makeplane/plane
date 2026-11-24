/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "./common";

export type TTeamKind = "regular" | "management";

export enum ETeamRole {
  ADMIN = 20,
  MEMBER = 15,
}

export type TTeam = {
  id: string;
  name: string;
  description: string;
  logo_props: TLogoProps;
  kind: TTeamKind;
  archived_at: string | null;
  workspace: string;
  // role of the current user, null when they are not in the team
  member_role: ETeamRole | null;
};

export type TTeamCreatePayload = Partial<Pick<TTeam, "name" | "description" | "kind">> & {
  admin_ids?: string[];
};

export type TTeamMember = {
  id: string;
  team: string;
  member: string;
  role: ETeamRole;
  created_at: string;
};

export type TPortfolio = {
  id: string;
  name: string;
  description: string;
  logo_props: TLogoProps;
  team: string;
  workspace: string;
  lead: string | null;
  sort_order: number;
  archived_at: string | null;
};

export type TProjectAccessChange = {
  member: string;
  display_name: string;
  before: number | null;
  after: number | null;
};

export type TProjectMoveResult = {
  dry_run: boolean;
  gained: TProjectAccessChange[];
  lost: TProjectAccessChange[];
  changed: TProjectAccessChange[];
};
