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

import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { IconButton } from "@plane/propel/icon-button";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { SubscriptionPill } from "@/components/common/subscription/subscription-pill";
import { useRoleManagement } from "@/hooks/store/use-role-management";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceSettingsSidebarHeader = observer(function WorkspaceSettingsSidebarHeader(props: Props) {
  const { workspaceSlug } = props;
  // router
  const navigate = useNavigate();
  // store hooks
  const { getCurrentUserWorkspaceRoleSlug } = usePermissionAccess();
  const { getWorkspaceRoleDetailsByRoleSlug } = useRoleManagement();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const currentWorkspaceRoleSlug = getCurrentUserWorkspaceRoleSlug(workspaceSlug);
  const roleDetail = currentWorkspaceRoleSlug
    ? getWorkspaceRoleDetailsByRoleSlug(workspaceSlug, currentWorkspaceRoleSlug)
    : undefined;

  return (
    <div className="sticky top-0 shrink-0 bg-surface-1 pb-1.5">
      <div className="py-3 pl-4 pr-5 flex items-center gap-1 text-body-md-medium">
        <IconButton
          variant="ghost"
          size="base"
          icon={ArrowLeft}
          onClick={() => navigate(`/${currentWorkspace?.slug}/`)}
        />
        <p>Workspace settings</p>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 py-0.5 px-5">
        <div className="flex items-center gap-2 truncate">
          <WorkspaceLogo
            logo={currentWorkspace?.logo_url}
            name={currentWorkspace?.name}
            classNames="shrink-0 size-8 border border-subtle rounded-md"
          />
          <div className="truncate">
            <p className="text-body-sm-medium truncate">{currentWorkspace?.name}</p>
            <p className="text-caption-md-regular truncate">{roleDetail?.name}</p>
          </div>
        </div>
        <div className="shrink-0">
          <SubscriptionPill />
        </div>
      </div>
    </div>
  );
});
