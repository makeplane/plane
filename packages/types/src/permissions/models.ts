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

import type { PermissionNamespace } from "./namespaces";
import type { PermissionSchemeRef } from "./permission-scheme";
import type { PermissionGrantString } from "./permission-strings";

/**
 * Role lifecycle status. Custom roles can be disabled ("inactive") so they
 * are retained for history but no longer assignable.
 */
export type RoleStatus = "active" | "inactive";

/**
 * Status filter for role-list getters. Callers must pick one explicitly so
 * UIs make a conscious choice about whether to surface disabled roles.
 * - "active": only assignable roles (default for selection UIs)
 * - "inactive": only disabled roles
 * - "all": include both (admin/management views)
 */
export type RoleStatusFilter = RoleStatus | "all";

/**
 * Role definition returned by role-management APIs.
 */
export type PermissionRole = {
  based_on: string | null;
  created_at: string;
  description: string;
  id: string;
  is_system: boolean;
  level: number;
  name: string;
  permission_schemes: PermissionSchemeRef[];
  permissions: Partial<Record<PermissionGrantString, true>>;
  slug: string;
  sort_order: number;
  status: RoleStatus;
  updated_at: string;
  member_count: number;
};

/**
 * Payload for creating a new role.
 */
export type CreateRolePayload = {
  name: string;
  description?: string;
  namespace: PermissionNamespace;
  permission_scheme_ids: string[];
  based_on_slug?: string;
};

/**
 * Payload for updating an existing role.
 */
export type UpdateRolePayload = {
  name?: string;
  description?: string;
  permission_scheme_ids?: string[];
  status?: RoleStatus;
  sort_order?: number;
  reassign_to?: string;
};

/**
 * Current user permission snapshot for one scope (workspace/project/teamspace).
 */
export type CurrentUserPermissionState = {
  relation: PermissionRole["slug"] | null;
  permission_grants: Array<PermissionGrantString>;
};
