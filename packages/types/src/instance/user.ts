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

import type { IUser } from "../users";

export type TInstanceUser = IUser & {
  is_instance_admin: boolean;
  workspace_count: number;
  joining_date: string;
};

export type TInstanceUserListParams = {
  search?: string;
  order_by?: string;
  per_page?: number;
  cursor?: string;
};

export type TInstanceUserListResponse = {
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
  results: TInstanceUser[];
};

export type TInstanceAdminCreatePayload = {
  email: string;
  password: string;
  is_password_reset_required: boolean;
};
