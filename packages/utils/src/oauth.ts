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

import { RESOURCE_PERMISSIONS_GROUPS, GLOBAL_PERMISSION_SCOPE } from "@plane/constants";

export const getResourcesFromScopeString = (
  scopeString: string
): { readResources: string[]; writeResources: string[] } => {
  const readResources: string[] = [];
  const writeResources: string[] = [];
  const scopes = scopeString.split(" ");
  for (const scope of scopes) {
    const isGlobalScope =
      scope === GLOBAL_PERMISSION_SCOPE.read_permission || scope === GLOBAL_PERMISSION_SCOPE.write_permission;
    const resourceKey = isGlobalScope ? "global" : scope.split(":")[0];
    const allResourceScopes = [
      ...RESOURCE_PERMISSIONS_GROUPS.flatMap((resource) => resource.scopes),
      GLOBAL_PERMISSION_SCOPE,
    ];
    const resource = allResourceScopes.find((resource) => resource.key === resourceKey);
    if (scope.includes("read") && resource?.title) {
      readResources.push(resource.title);
    } else if (scope.includes("write") && resource?.title) {
      writeResources.push(resource.title);
    }
  }
  return { readResources, writeResources };
};
