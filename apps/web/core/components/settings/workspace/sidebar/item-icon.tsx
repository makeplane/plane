/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";
import {
  BillingsOutline,
  BuildingOutline,
  ExportOutline,
  MembersOutline,
  WebhooksOutline,
} from "@makeplane/propel/icons";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import type { TWorkspaceSettingsTabs } from "@plane/types";

export const WORKSPACE_SETTINGS_ICONS: Record<TWorkspaceSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: BuildingOutline,
  members: MembersOutline,
  export: ExportOutline,
  "billing-and-plans": BillingsOutline,
  webhooks: WebhooksOutline,
};
