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

import type { TWorkItemBlueprint, TWorkItemBlueprintFormData } from "../templates/blueprint/work-item";

export enum ERecurringWorkItemIntervalType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export type TRecurringWorkItem = {
  id: string;
  workitem_blueprint: TWorkItemBlueprint;
  enabled: boolean;
  // frequency
  start_at: Date;
  end_at: Date | null;
  interval_type: ERecurringWorkItemIntervalType;
  interval_count: number; // Repeat every X intervals (e.g., 2 = every 2 weeks/months)
  // workspace
  workspace: string;
  // project
  project: string;
  // timestamp
  created_at: string;
  updated_at: string;
  // user
  created_by: string | undefined;
  updated_by: string | undefined;
};

export type TRecurringWorkItemForm = Pick<
  TRecurringWorkItem,
  "id" | "enabled" | "start_at" | "end_at" | "interval_type" | "interval_count"
> & {
  workitem_blueprint: TWorkItemBlueprintFormData;
};
