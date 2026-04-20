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

export type GroupSyncConfig = {
  id: string;
  is_enabled: boolean;
  sync_on_login: boolean;
  auto_remove: boolean;
  group_attribute_key: string;
  sync_offline: boolean;
  default_workspace_role: string;
  default_workspace_role_detail: GroupMapRoleDetail;
  created_at: string;
  updated_at: string;
};

export type GroupMapRoleDetail = {
  id: string;
  slug: string;
  name: string;
};

export type GroupMap = {
  id: string;
  idp_group_name: string;
  project: string;
  role: string;
  role_detail: GroupMapRoleDetail | null;
  created_at: string;
  updated_at: string;
};
