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

import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// components
import { getWorkspaceActivePath } from "@/components/settings/helper";
// plane imports
import { E_FEATURE_FLAGS, WORKSPACE_SETTINGS } from "@plane/constants";
// plane web components
import { WorkspaceMembersActivitySidebar } from "@/components/workspace/settings/members/sidebar";
import { useFlag } from "@/plane-web/hooks/store";

type TWorkspaceRightSidebarProps = { workspaceSlug: string };

export const WorkspaceRightSidebar = observer(function WorkspaceRightSidebar(props: TWorkspaceRightSidebarProps) {
  const { workspaceSlug } = props;
  // next hooks
  const pathname = usePathname();
  // store hooks
  const isWorkspaceMembersActivityEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.WORKSPACE_MEMBER_ACTIVITY);

  return (
    <>
      {/* Workspace members activity sidebar */}
      {getWorkspaceActivePath(pathname) === WORKSPACE_SETTINGS["members"]["i18n_label"] &&
        isWorkspaceMembersActivityEnabled && (
          <div className="block">
            <WorkspaceMembersActivitySidebar workspaceSlug={workspaceSlug} />
          </div>
        )}
    </>
  );
});
