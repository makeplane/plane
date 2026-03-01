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

import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
// components
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";

export function DesktopSidebarWorkspaceMenu() {
  if (!isDesktopApp()) return null;
  return (
    <div className="pb-1.5">
      <WorkspaceMenuRoot variant="sidebar" />
    </div>
  );
}
