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

import type { EUpdateStatus } from "@plane/types";
import type { TProjectUpdateReaction } from "./update_reaction";

export enum EProjectUpdateStatus {
  OFF_TRACK = "OFF-TRACK",
  ON_TRACK = "ON-TRACK",
  AT_RISK = "AT-RISK",
}

export type TProjectUpdate = {
  id: string;
  status: EUpdateStatus;
  description: string;
  created_by: string;
  updated_at: string;
  update_reactions: TProjectUpdateReaction[];
  comments_count: number;
  completed_issues: number;
  total_issues: number;
};
