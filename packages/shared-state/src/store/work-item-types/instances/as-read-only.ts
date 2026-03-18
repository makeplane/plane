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
 * Wraps a MobX observable instance in a Proxy that overrides all `can*` permission
 * getters to return `false`, making the instance appear read-only to consumers.
 *
 * Uses the `can` prefix convention (matching the abstract getters in
 * `BaseWorkItemTypeInstance` and `BaseCustomPropertyInstance`) so any new
 * permission getter is automatically covered.
 *
 * Used by project-level stores to return shared workspace instances as read-only,
 * without cloning or mutating the original.
 */
export function asReadOnly<T extends object>(instance: T): T {
  return new Proxy(instance, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && prop.startsWith("can")) return false;
      return Reflect.get(target, prop, receiver);
    },
  });
}
