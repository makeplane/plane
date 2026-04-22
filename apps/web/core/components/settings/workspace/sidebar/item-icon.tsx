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

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Blocks,
  Building,
  Cable,
  CreditCard,
  FileCode,
  KeyRound,
  Shapes,
  Timer,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import {
  CustomersIcon,
  GroupSyncingIcon,
  InitiativeIcon,
  PiIcon,
  ProjectStatesIcon,
  RelationPropertyIcon,
  ReleaseIcon,
  TeamsIcon,
  WorkItemsIcon,
  WorkspaceIcon,
  ProjectIcon,
} from "@plane/propel/icons";
import type { TWorkspaceSettingsTabs } from "@plane/types";

export const WORKSPACE_SETTINGS_ICONS: Record<TWorkspaceSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: Building,
  members: Users,
  permissions: KeyRound,
  export: ArrowUpToLine,
  "billing-and-plans": CreditCard,
  webhooks: Webhook,
  import: ArrowDownToLine,
  worklogs: Timer,
  "group-syncing": GroupSyncingIcon,
  identity: Building,
  teamspaces: TeamsIcon,
  initiatives: InitiativeIcon,
  customers: CustomersIcon,
  releases: ReleaseIcon,
  templates: Shapes,
  integrations: Cable,
  connections: Blocks,
  project_states: ProjectStatesIcon,
  relations: RelationPropertyIcon,
  "plane-intelligence": PiIcon,
  "access-tokens": KeyRound,
  scripts: FileCode,
  project_roles_and_schemes: ProjectIcon,
  workspace_roles_and_schemes: WorkspaceIcon,
  work_item_types: WorkItemsIcon,
  automations: Zap,
};
