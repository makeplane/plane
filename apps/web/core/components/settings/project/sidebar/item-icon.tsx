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
import { Timer, Users, Zap } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import {
  CycleIcon,
  EpicIcon,
  EstimatePropertyIcon,
  IntakeIcon,
  LabelPropertyIcon,
  MilestoneIcon,
  ModuleIcon,
  PageIcon,
  StatePropertyIcon,
  UpdatesIcon,
  ViewsIcon,
  WorkflowIcon,
  WorkItemsIcon,
} from "@plane/propel/icons";
import type { TProjectSettingsTabs } from "@plane/types";
// components
import { SettingIcon } from "@/components/icons/attachment";

export const PROJECT_SETTINGS_ICONS: Record<TProjectSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: SettingIcon,
  members: Users,
  worklogs: Timer,
  features_cycles: CycleIcon,
  features_modules: ModuleIcon,
  features_views: ViewsIcon,
  features_pages: PageIcon,
  features_intake: IntakeIcon,
  features_time_tracking: Timer,
  features_milestones: MilestoneIcon,
  states: StatePropertyIcon,
  labels: LabelPropertyIcon,
  estimates: EstimatePropertyIcon,
  automations: Zap,
  "work-item-types": WorkItemsIcon,
  workflows: WorkflowIcon,
  epics: EpicIcon,
  project_updates: UpdatesIcon,
  templates: SettingIcon,
  recurring_work_items: WorkItemsIcon,
};
