/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// components
import { NotificationsSidebarRoot } from "@/components/workspace-notifications/sidebar";

export default function ProjectInboxIssuesLayout() {
  return (
    <div className="relative w-full h-full overflow-hidden flex items-center">
      <NotificationsSidebarRoot />
      <div className="w-full h-full overflow-hidden overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
