/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";

// Mirrors backend plane/license/menu_registry.py PERMISSION_KEYS — keep in sync.
// general/email/ai/image/authentication all persist via the single
// configurations endpoint, so they share the grouped "settings" permission.
export type TPermissionKey =
  | "settings"
  | "workspace"
  | "users"
  | "departments"
  | "staff"
  | "monitoring"
  | "task-categories"
  | "help-center"
  | "job-positions"
  | "calendar"
  | "usage-monitor"
  | "administrators";

export type TSidebarMenuItem = {
  Icon: LucideIcon | React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  href: string;
  // Menu key gating this item — items hidden unless granted (super sees all)
  permission: TPermissionKey;
};
