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

// plane priority
export enum E_PLANE_PRIORITY {
  URGENT = "urgent",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  NONE = "none",
}

export type TPlanePriority =
  | E_PLANE_PRIORITY.URGENT
  | E_PLANE_PRIORITY.HIGH
  | E_PLANE_PRIORITY.MEDIUM
  | E_PLANE_PRIORITY.LOW
  | E_PLANE_PRIORITY.NONE;

export type TPlanePriorityData = {
  key: TPlanePriority;
  label: string;
};

export type TImporterPATError = {
  showPATError: boolean;
  message: string;
};
