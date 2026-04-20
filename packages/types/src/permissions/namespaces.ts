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

/**
 * Supported role-definition namespaces.
 *
 * - `workspace`: grants evaluated at workspace scope.
 * - `project`: grants evaluated per project.
 * - `teamspace`: grants evaluated per teamspace.
 */
export const PERMISSION_NAMESPACE_VALUES = {
  WORKSPACE: "workspace",
  PROJECT: "project",
  TEAMSPACE: "teamspace",
} as const;

/**
 * Literal union for API payloads and store indexing.
 */
export type PermissionNamespace = (typeof PERMISSION_NAMESPACE_VALUES)[keyof typeof PERMISSION_NAMESPACE_VALUES];
