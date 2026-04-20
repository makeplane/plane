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

export const NAMESPACES = [
  "accessibility",
  "auth",
  "automation",
  "common",
  "customer",
  "cycle",
  "dashboard-widget",
  "editor",
  "empty-state",
  "epic",
  "home",
  "importer",
  "inbox",
  "initiative",
  "intake-form",
  "integration",
  "module",
  "navigation",
  "notification",
  "page",
  "power-k",
  "pql",
  "project",
  "project-settings",
  "release",
  "roles-and-permissions",
  "settings",
  "stickies",
  "teamspace",
  "template",
  "tour",
  "update",
  "wiki",
  "work-item",
  "work-item-type",
  "workflow",
  "workspace",
  "workspace-settings",
] as const;

export type TNamespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: TNamespace = "common";
