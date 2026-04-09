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

import type { ReactNode } from "react";
import { AlignLeft, ArrowRightLeft, CalendarDays, FileText, Paperclip, Type } from "lucide-react";
import {
  CustomersIcon,
  CycleIcon,
  EpicIcon,
  EstimatePropertyIcon,
  IntakeIcon,
  LabelPropertyIcon,
  LinkIcon,
  MembersPropertyIcon,
  MilestoneIcon,
  ModuleIcon,
  ParentPropertyIcon,
  PriorityPropertyIcon,
  StatePropertyIcon,
} from "@plane/propel/icons";

const ICON_CLASS = "h-3.5 w-3.5 text-secondary";

export const DEFAULT_FIELD_ICON_MAP = {
  state: <StatePropertyIcon className={ICON_CLASS} />,
  workflow_state_removed: <StatePropertyIcon className={ICON_CLASS} />,
  workflow_approved: <StatePropertyIcon className={ICON_CLASS} />,
  workflow_rejected: <StatePropertyIcon className={ICON_CLASS} />,
  priority: <PriorityPropertyIcon className={ICON_CLASS} />,
  assignees: <MembersPropertyIcon className={ICON_CLASS} />,
  start_date: <CalendarDays className={ICON_CLASS} />,
  target_date: <CalendarDays className={ICON_CLASS} />,
  labels: <LabelPropertyIcon className={ICON_CLASS} />,
  estimate_points: <EstimatePropertyIcon className={ICON_CLASS} />,
  estimate_categories: <EstimatePropertyIcon className={ICON_CLASS} />,
  estimate_point: <EstimatePropertyIcon className={ICON_CLASS} />,
  estimate_time: <EstimatePropertyIcon className={ICON_CLASS} />,
  parent: <ParentPropertyIcon className={ICON_CLASS} />,
  cycles: <CycleIcon className={ICON_CLASS} />,
  modules: <ModuleIcon className={ICON_CLASS} />,
  name: <Type className={ICON_CLASS} />,
  description: <AlignLeft className={ICON_CLASS} />,
  type: <ArrowRightLeft className={ICON_CLASS} />,
  link: <LinkIcon className={ICON_CLASS} />,
  attachment: <Paperclip className={ICON_CLASS} />,
  intake: <IntakeIcon className={ICON_CLASS} />,
  inbox: <IntakeIcon className={ICON_CLASS} />,
  page: <FileText className={ICON_CLASS} />,
  customer: <CustomersIcon className={ICON_CLASS} />,
  customer_request: <CustomersIcon className={ICON_CLASS} />,
  epic: <EpicIcon className={ICON_CLASS} />,
  milestones: <MilestoneIcon className={ICON_CLASS} />,
  work_item: <ArrowRightLeft className={ICON_CLASS} />,
  hierarchy_break: <ParentPropertyIcon className={ICON_CLASS} />,
} satisfies Record<string, ReactNode>;
