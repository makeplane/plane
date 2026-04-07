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

export enum EPageSharedUserAccess {
  VIEW = 0,
  COMMENT = 1,
  EDIT = 2,
}

export type TCollaborator = {
  name: string;
  color: string;
  id?: string;
  photoUrl?: string;
  clientId?: number;
};

export type TPageSharedUser = {
  user_id: string;
  access: EPageSharedUserAccess;
};

export type TPageExtended = {
  shared_access: EPageSharedUserAccess | null;
  is_shared: boolean;
  collaborators: TCollaborator[];
  sub_pages_count: number | undefined;
  team: string | null | undefined;
  parent_id: string | null | undefined;
  anchor?: string | null | undefined;
  sharedUsers: TPageSharedUser[]; // Users the page is shared with
  sort_order: number | undefined;
};

export type TMovePageEntity = "workspace" | "project" | "teamspace";

export type TMovePageRealtimeEntity = TMovePageEntity | "collection";

export type TMovePageActions =
  | Exclude<`${TMovePageEntity}_to_${TMovePageEntity}`, "workspace_to_workspace">
  | "collection_to_collection";

export type TMovePagePayload = {
  move_type: TMovePageActions;
  source_identifier: string;
  target_identifier: string;
};
