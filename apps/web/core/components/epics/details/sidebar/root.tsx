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
import { Activity } from "lucide-react";
// plane imports
import { CommentFillIcon, InfoFillIcon, UpdatesIcon } from "@plane/propel/icons";
import { EUpdateEntityType } from "@plane/types";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// plane web
import { SidebarRoot } from "@/components/common/layout/sidebar";
// local components
import { SidebarContentWrapper } from "@/components/common/layout/sidebar/content-wrapper";
import { UpdatesWrapper } from "@/components/updates/root";
import { EpicSidebarActivityRoot } from "./activity-tab-root";
import { EpicSidebarCommentsRoot } from "./comment-tab-root";
import { EpicSidebarPropertiesRoot } from "./properties-tab-root";
import { useEpicUpdates } from "./use-updates";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

type TEpicDetailsSidebarProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  permissions: {
    canEdit: boolean;
    canEditProperty: (property: TWorkItemProperty) => boolean;
    comments: {
      canCreate: boolean;
      canEdit: (commentId: string) => boolean;
      canDelete: (commentId: string) => boolean;
      canReact: (commentId: string) => boolean;
    };
    updates: {
      canAdd: boolean;
      canEdit: (updateId: string) => boolean;
      canDelete: (updateId: string) => boolean;
      canReact: (updateId: string) => boolean;
      comment: {
        canCreate: (updateId: string) => boolean;
        canUpdate: (updateId: string, commentId: string) => boolean;
        canDelete: (updateId: string, commentId: string) => boolean;
        canReact: (updateId: string, commentId: string) => boolean;
      };
    };
  };
};

export const EpicDetailsSidebar = observer(function EpicDetailsSidebar(props: TEpicDetailsSidebarProps) {
  const { workspaceSlug, projectId, epicId, permissions } = props;
  // store hooks
  const { epicDetailSidebarCollapsed } = useAppTheme();
  const { handleUpdateOperations } = useEpicUpdates(workspaceSlug, projectId, epicId);

  const EPIC_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: (
        <EpicSidebarPropertiesRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          permissions={permissions}
        />
      ),
    },
    {
      key: "updates",
      icon: UpdatesIcon,
      content: (
        <SidebarContentWrapper>
          <UpdatesWrapper
            entityId={epicId}
            entityType={EUpdateEntityType.EPIC}
            handleUpdateOperations={handleUpdateOperations}
            permissions={permissions.updates}
          />
        </SidebarContentWrapper>
      ),
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: (
        <EpicSidebarCommentsRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          permissions={permissions.comments}
        />
      ),
    },
    {
      key: "activity",
      icon: Activity,
      content: <EpicSidebarActivityRoot epicId={epicId} />,
    },
  ];

  return (
    <SidebarRoot
      tabs={EPIC_DETAILS_SIDEBAR_TABS}
      storageKey={`epic-detail-sidebar-${epicId}`}
      defaultTab="properties"
      isSidebarOpen={!epicDetailSidebarCollapsed}
    />
  );
});
