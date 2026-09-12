/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IUserLite } from "./users";

/** Where a chat lives: the whole workspace, or one project inside it. */
export type TChatScope = {
  workspaceSlug: string;
  projectId?: string;
};

export type TChatChannel = {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  workspace: string;
  project: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TChatMessage = {
  id: string;
  channel: string;
  content: string;
  sender: IUserLite | null;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
};

export type TChatMessagePage = {
  results: TChatMessage[];
  has_more: boolean;
  server_time: string;
};
