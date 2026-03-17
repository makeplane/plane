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

// local types
import type { TLogoProps } from "../common";
import type { TWorkItemFilterExpression } from "../view-props";

export type TDashboardLevel = "workspace";

export type TDashboard = {
  created_at: Date | undefined;
  created_by: string | undefined;
  filters: TWorkItemFilterExpression | undefined;
  id: string | undefined;
  is_favorite: boolean | undefined;
  logo_props: TLogoProps | undefined;
  name: string | undefined;
  owned_by: string | undefined;
  project_ids: string[] | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  workspace: string | undefined;
};
