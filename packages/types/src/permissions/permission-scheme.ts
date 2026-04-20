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

/**
 * Permission scheme entity returned by the permission-schemes API.
 */
export type PermissionScheme = {
  id: string;
  name: string;
  slug: string;
  description: string;
  namespace: PermissionNamespace;
  permissions: string[];
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/**
 * Lightweight reference to a permission scheme, nested inside role responses.
 */
export type PermissionSchemeRef = Pick<PermissionScheme, "id" | "name" | "slug" | "namespace" | "is_system">;

/**
 * Impact summary for a permission scheme (from /permission-schemes/<pk>/impact/).
 */
export type PermissionSchemeImpact = {
  roles: number;
  users: number;
  projects: number;
};
