/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TMailbox = {
  id: string;
  email: string;
  local_part: string;
  domain: string;
  is_active: boolean;
  quota_mb: number;
  created_at: string;
  updated_at: string;
};

export type TMailboxCreatePayload = {
  email: string;
  password: string;
  quota_mb?: number;
  is_active?: boolean;
};

export type TMailboxUpdatePayload = {
  password?: string;
  is_active?: boolean;
  quota_mb?: number;
};

export type TMailAlias = {
  id: string;
  source: string;
  destination: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TMailAliasCreatePayload = {
  source: string;
  destination: string;
  is_active?: boolean;
};

export type TMailConfig = {
  mail_domain: string;
  mail_local: boolean;
};
