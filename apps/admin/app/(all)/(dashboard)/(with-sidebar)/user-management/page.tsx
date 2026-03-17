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

// plane admin imports
import { UserManagementRoot } from "@/plane-admin/components/user-management/root";
// types
import type { Route } from "./+types/page";

function UserManagementPage() {
  return <UserManagementRoot />;
}

export const meta: Route.MetaFunction = () => [{ title: "User Management - God Mode" }];

export default UserManagementPage;
