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

import type {
  PermissionActionForResource,
  PermissionCondition,
  PermissionGrantString,
  PermissionResource,
  PermissionString,
} from "@plane/types";
import { isValidPermissionCondition, isValidPermissionForResource, isValidPermissionResource } from "./validation";

/**
 * Builds a strongly typed `resource:action` permission string.
 *
 * Example: `buildPermissionString({ resource: "workitem", action: "edit" })`
 * -> `"workitem:edit"`.
 */
export function buildPermissionString<R extends PermissionResource>(args: {
  resource: R;
  action: PermissionActionForResource<R>;
}): PermissionString {
  return `${args.resource}:${args.action}` as PermissionString;
}

/**
 * Parses a grant string into resource/action/conditions.
 *
 * Contract:
 * - returns `undefined` for malformed or unknown grants
 * - returns wildcard actions as `{ action: "*" }`
 * - enforces unique/valid condition suffix tokens
 */
export function parsePermissionGrantString(permission: PermissionGrantString):
  | {
      resource: PermissionResource;
      action: string;
      conditions: PermissionCondition[];
    }
  | undefined {
  const colonParts = permission.split(":");
  if (colonParts.length !== 2) return undefined;

  const [resource, actionWithConditions] = colonParts;
  if (!isValidPermissionResource(resource)) return undefined;

  const [action, ...conditionParts] = actionWithConditions.split("+");
  if (action !== "*" && !isValidPermissionForResource(resource, action)) return undefined;

  const conditions: PermissionCondition[] = [];
  const seen = new Set<string>();
  for (const condition of conditionParts) {
    if (!isValidPermissionCondition(condition)) return undefined;
    if (seen.has(condition)) return undefined;
    seen.add(condition);
    conditions.push(condition);
  }

  return { resource, action, conditions };
}
