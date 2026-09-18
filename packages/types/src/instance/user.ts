/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAdminRole } from "../research";

export type TInstanceUserAdminRole = TAdminRole;

export type TInstanceUser = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_bot: boolean;
  last_login: string | null;
  date_joined: string;
  admin_roles: TAdminRole[];
  research_profile: {
    student_no: string;
    grade: string;
    degree: string;
    phone: string;
    category: string;
    group_label: string;
  } | null;
  workspace_memberships: string[];
  import_source: { batch_id: string; kind: "ROSTER" | "ADVISOR"; created_at: string } | null;
};

export type TInstanceUserRoleResponse = {
  user_id: string;
  email?: string;
  role?: TAdminRole;
  roles: TAdminRole[];
  created?: boolean;
  revoked?: boolean;
  available_roles?: { key: TAdminRole; label: string }[];
};
