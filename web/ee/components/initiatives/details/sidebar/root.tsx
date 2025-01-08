"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// icons
import { Activity } from "lucide-react";
import { CommentFillIcon, InfoFillIcon } from "@plane/ui";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web
import { SidebarRoot } from "@/plane-web/components/common";
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
// local components
import { InitiativeSidebarActivityRoot } from "./activity-tab-root";
import { InitiativeSidebarCommentsRoot } from "./comment-tab-root";
import { InitiativeSidebarPropertiesRoot } from "./properties-tab-root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeSidebarRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // store hooks
  const { initiativesSidebarCollapsed } = useAppTheme();

  const INITIATIVE_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: (
        <SidebarContentWrapper title="Properties">
          <InitiativeSidebarPropertiesRoot
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
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
          <InitiativeSidebarCommentsRoot
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
          />
        </SidebarContentWrapper>
      ),
    },
    {
      key: "activity",
      icon: Activity,
      content: (
        <SidebarContentWrapper title="Activity">
          <InitiativeSidebarActivityRoot initiativeId={initiativeId} />
        </SidebarContentWrapper>
      ),
    },
  ];

  return (
    <SidebarRoot
      tabs={INITIATIVE_DETAILS_SIDEBAR_TABS}
      storageKey={`initiative-detail-sidebar-${initiativeId}`}
      defaultTab="properties"
      isSidebarOpen={!initiativesSidebarCollapsed}
    />
  );
});
