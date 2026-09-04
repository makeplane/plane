/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAIScopeAction, TAIScopeResourceType } from "@plane/types";

export const AI_ACCOUNTS_LIST = (workspaceSlug: string) => `AI_ACCOUNTS_LIST_${workspaceSlug}`;

export const AI_ACCOUNT_SCOPES = (workspaceSlug: string, accountId: string) =>
  `AI_ACCOUNT_SCOPES_${workspaceSlug}_${accountId}`;

export const AI_SCOPE_RESOURCE_TYPES: TAIScopeResourceType[] = [
  "project",
  "member",
  "user",
  "asset",
  "estimate",
  "cycle",
  "module",
  "sticky",
  "label",
  "intake",
  "work_item",
  "comment",
  "state",
  "page",
  "invite",
];

export const AI_SCOPE_ACTIONS: TAIScopeAction[] = ["read", "create", "update", "delete"];
