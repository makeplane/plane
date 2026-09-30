/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Building,
  CreditCard,
  FolderKanban,
  Layers,
  LayoutTemplate,
  Users,
  Webhook,
} from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import type { TWorkspaceSettingsTabs } from "@plane/types";

export const WORKSPACE_SETTINGS_ICONS: Record<TWorkspaceSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: Building,
  members: Users,
  export: ArrowUpToLine,
  import: ArrowDownToLine,
  "billing-and-plans": CreditCard,
  "work-item-templates": LayoutTemplate,
  "work-item-types": Layers,
  "project-templates": FolderKanban,
  webhooks: Webhook,
};
