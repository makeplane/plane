/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IApiToken {
  created_at: string;
  created_by: string;
  description: string;
  expired_at: string | null;
  id: string;
  is_active: boolean;
  label: string;
  last_used: string | null;
  updated_at: string;
  updated_by: string;
  user: string;
  user_type: number;
  token?: string;
  workspace: string;
}


export type TServiceAccessTokenScopeLevel = "workspace" | "instance";

export interface IServiceAccessTokenWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface IServiceAccessToken {
  id: string;
  label: string;
  description: string;
  is_active: boolean;
  last_used: string | null;
  expired_at: string | null;
  scope_level: TServiceAccessTokenScopeLevel;
  scopes: string[];
  token_prefix: string;
  workspace: IServiceAccessTokenWorkspace | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  token?: string;
}

export interface IServiceAccessTokenCreate {
  label: string;
  description?: string;
  expired_at?: string | null;
  scopes: string[];
}
