/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
import { useUser } from "@/hooks/store/user";
import { UserService } from "@/services/user.service";

const userService = new UserService();

/** Instance administration is separate from workspace and research roles. */
export function useInstanceAdmin() {
  const { data: user } = useUser();
  const { data } = useSWR(user?.id ? ["INSTANCE_ADMIN_STATUS", user.id] : null, () =>
    userService.currentUserInstanceAdminStatus()
  );

  return Boolean(user?.id && data?.is_instance_admin);
}
