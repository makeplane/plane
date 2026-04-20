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

// plane imports
import type { PermissionNamespace } from "@plane/types";
// local imports
import type { PermissionMatrixGroup } from "./matrix-types";
import { WORKSPACE_PERMISSION_GROUPS } from "./workspace-permission-groups";
import { PROJECT_PERMISSION_GROUPS } from "./project-permission-groups";

export const getPermissionGroupsByNamespace = (namespace: PermissionNamespace): PermissionMatrixGroup[] => {
  if (namespace === "workspace") return WORKSPACE_PERMISSION_GROUPS;
  if (namespace === "project") return PROJECT_PERMISSION_GROUPS;
  return []; // teamspace — not yet supported in the permission form
};
