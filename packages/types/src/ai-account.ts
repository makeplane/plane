/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TAIAccountBotUser = {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string;
  is_bot: boolean;
  bot_type: string;
};

export type TAIScopeResourceType =
  | "project"
  | "member"
  | "user"
  | "asset"
  | "estimate"
  | "cycle"
  | "module"
  | "sticky"
  | "label"
  | "intake"
  | "work_item"
  | "comment"
  | "state"
  | "page"
  | "invite";

export type TAIScopeAction = "read" | "create" | "update" | "delete";

export type TAIScopePolicy = {
  id: string;
  project: string | null;
  resource_type: TAIScopeResourceType;
  action: TAIScopeAction;
};

export type TAIAccount = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  workspace: string;
  owner: string;
  bot_user: TAIAccountBotUser;
  scope_policies: TAIScopePolicy[];
  created_at: string;
  updated_at: string;
};

export type TAIAccountCreatePayload = {
  name: string;
  description?: string;
  role?: 15 | 5;
};

export type TAIAccountUpdatePayload = {
  name?: string;
  description?: string;
  is_active?: boolean;
};

export type TAIScopePolicyInput = {
  project: string | null;
  resource_type: TAIScopeResourceType;
  action: TAIScopeAction;
};
