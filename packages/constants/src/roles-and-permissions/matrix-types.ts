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
  PermissionNamespace,
  PermissionResource,
  PermissionString,
} from "@plane/types";

export type PermissionNamespaceForManagement = Extract<PermissionNamespace, "workspace" | "project">;

export type PermissionMatrixRow = {
  rowId: PermissionString;
  namespace: PermissionNamespaceForManagement;
  groupKey: string;
  resource: PermissionResource;
  action: PermissionActionForResource<PermissionResource>;
  labelKey: string;
  prerequisites?: PermissionString[] | undefined;
  conditions: readonly PermissionCondition[];
  /** Populated by buildPermissionGroups — permissions auto-granted when this row is toggled (includes self). */
  foldedChildren?: PermissionString[];
  /** i18n key for tooltip explaining what's folded under this row. */
  foldTooltipKey?: string;
  /** Row is hidden from the UI and always present in matrix state + saved grants. */
  alwaysEnabled?: boolean;
};

export type PermissionMatrixGroup = {
  key: string;
  titleKey: string;
  descriptionKey: string;
  namespace: PermissionNamespaceForManagement;
  order: number;
  rows: PermissionMatrixRow[];
};

export type PermissionEntry = {
  labelKey: string;
  prerequisites?: PermissionString[];
  /** If set, this permission is hidden from the UI and auto-granted when the parent is toggled. */
  foldedUnder?: PermissionString;
  /** i18n key for tooltip explaining what's folded under this row. Only meaningful on fold parents. */
  foldTooltipKey?: string;
  /**
   * Row is hidden from the UI and always present in matrix state + saved grants.
   * Use for scope-entry permissions (workspace:view, project:view) that are implicit
   * from role assignment and should not be individually toggleable.
   */
  alwaysEnabled?: boolean;
};

export type ResourcePermissions<R extends PermissionResource> = {
  readonly [A in PermissionActionForResource<R>]?: PermissionEntry;
};
