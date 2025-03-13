"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Activity } from "lucide-react";
import { CommentFillIcon, InfoFillIcon } from "@plane/ui";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web
import { SidebarRoot } from "@/plane-web/components/common";
// local components
import { EpicSidebarActivityRoot } from "./activity-tab-root";
import { EpicSidebarCommentsRoot } from "./comment-tab-root";
import { EpicSidebarPropertiesRoot } from "./properties-tab-root";

type TEpicDetailsSidebarProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicDetailsSidebar: FC<TEpicDetailsSidebarProps> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // store hooks
  const { epicDetailSidebarCollapsed } = useAppTheme();

  const EPIC_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: (
        <EpicSidebarPropertiesRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={disabled}
        />
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
          disabled={disabled}
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
