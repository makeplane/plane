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

export enum CYCLE_ACTION {
  START = "START",
  STOP = "STOP",
}

export const ESTIMATE_TYPE: {
  [key: string]: string;
} = {
  issues: "work items",
  points: "points",
  time: "time",
};
