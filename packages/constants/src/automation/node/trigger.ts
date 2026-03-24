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

import type { TTriggerNodeHandlerName } from "@plane/types";
import { ETriggerNodeHandlerName } from "@plane/types";

export type TAutomationTriggerIconKey = "LayersIcon" | "DoubleCircleIcon" | "Users" | "MessageCircle" | "ClockIcon";

export type TAutomationTriggerSelectOption = {
  iconKey: TAutomationTriggerIconKey;
  label: string;
  readableLabel: string;
  value: TTriggerNodeHandlerName;
};

export const AUTOMATION_TRIGGER_SELECT_OPTIONS: TAutomationTriggerSelectOption[] = [
  {
    iconKey: "LayersIcon",
    label: "Work item created",
    readableLabel: "A work item is created",
    value: ETriggerNodeHandlerName.RECORD_CREATED,
  },
  {
    iconKey: "LayersIcon",
    label: "Work item updated",
    readableLabel: "A work item is updated",
    value: ETriggerNodeHandlerName.RECORD_UPDATED,
  },
  {
    iconKey: "DoubleCircleIcon",
    label: "State changed",
    readableLabel: "The state of a work item changes",
    value: ETriggerNodeHandlerName.STATE_CHANGED,
  },
  {
    iconKey: "Users",
    label: "Assignee changed",
    readableLabel: "The assignee of a work item changes",
    value: ETriggerNodeHandlerName.ASSIGNEE_CHANGED,
  },
  {
    iconKey: "MessageCircle",
    label: "Comment created",
    readableLabel: "A comment is added",
    value: ETriggerNodeHandlerName.COMMENT_CREATED,
  },
];

export const AUTOMATION_TRIGGER_TIME_BASED_OPTIONS: TAutomationTriggerSelectOption[] = [
  {
    iconKey: "ClockIcon",
    label: "Fixed schedule",
    readableLabel: "A fixed schedule is triggered",
    value: ETriggerNodeHandlerName.FIXED_SCHEDULE,
  },
];
