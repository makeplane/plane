"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Activity } from "lucide-react";
import { EIssueServiceType } from "@plane/constants";
import { CommentFillIcon, InfoFillIcon } from "@plane/ui";
import { ActivitySortRoot } from "@/components/issues";
// hooks
import { useAppTheme, useIssueDetail } from "@/hooks/store";
// plane web
import { SidebarRoot } from "@/plane-web/components/common";
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
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

  const {
    activity: { sortOrder, toggleSortOrder },
  } = useIssueDetail(EIssueServiceType.EPICS);

  const EPIC_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: (
        <SidebarContentWrapper title="Properties">
          <EpicSidebarPropertiesRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            disabled={disabled}
          />
        </SidebarContentWrapper>
      ),
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: (
        <SidebarContentWrapper title="Comments">
          <EpicSidebarCommentsRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            disabled={disabled}
          />
        </SidebarContentWrapper>
      ),
    },
    {
      key: "activity",
      icon: Activity,
      content: (
        <SidebarContentWrapper
          title="Activity"
          actionElement={
            <ActivitySortRoot
              sortOrder={sortOrder}
              toggleSort={toggleSortOrder}
              className="flex-shrink-0"
              iconClassName="size-3"
            />
          }
        >
          <EpicSidebarActivityRoot epicId={epicId} />
        </SidebarContentWrapper>
      ),
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
