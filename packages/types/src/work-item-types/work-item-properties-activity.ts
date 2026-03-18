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

import type { IUserLite } from "../users";

export type TWorkItemPropertyAction = "created" | "updated" | "deleted";

export type TWorkItemPropertiesActivity = {
  id: string | undefined;
  old_value: string | undefined;
  new_value: string | undefined;
  old_identifier: string | undefined;
  new_identifier: string | undefined;

  action: TWorkItemPropertyAction | undefined;
  epoch: number | undefined;
  comment: string | undefined;
  actor_detail: IUserLite | undefined;

  issue: string | undefined;
  property: string | undefined;
  actor: string | undefined;
  project: string | undefined;
  workspace: string | undefined;

  created_at: string | undefined;
  created_by: string | undefined;
  updated_at: string | undefined;
  updated_by: string | undefined;
};
