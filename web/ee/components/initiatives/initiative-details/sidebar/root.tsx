"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Activity } from "lucide-react";
import { CommentFillIcon, InfoFillIcon, Tabs } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
// local components
import { InitiativeSidebarActivityRoot } from "./acitivity-tab";
import { InitiativeSidebarCommentsRoot } from "./comments-tab";
import { InitiativeSidebarPropertiesRoot } from "./properties-tab";
import { SidebarTabContent } from "./sidebar-tab-content";

type TInitiativeDetailsSidebarProps = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativeDetailsSidebar: FC<TInitiativeDetailsSidebarProps> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // store hooks
  const { initiativesSidebarCollapsed } = useAppTheme();

  const INITIATIVE_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: (
        <SidebarTabContent title="Properties">
          <InitiativeSidebarPropertiesRoot
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
          />
        </SidebarTabContent>
      ),
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: (
        <SidebarTabContent title="Comments">
          <InitiativeSidebarCommentsRoot
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
          />
        </SidebarTabContent>
      ),
    },
    {
      key: "activity",
      icon: Activity,
      content: (
        <SidebarTabContent title="Activity">
          <InitiativeSidebarActivityRoot
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
          />
        </SidebarTabContent>
      ),
    },
  ];

  return (
    <div
      className={cn(
        `absolute right-0 z-[5] flex flex-col gap-4 p-6 h-full border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 sm:relative transition-[width] ease-linear overflow-hidden overflow-y-auto`,
        {
          "w-0 hidden": initiativesSidebarCollapsed,
          "min-w-[300px] w-full sm:w-1/2  md:w-1/3 lg:min-w-80 xl:min-w-96": !initiativesSidebarCollapsed,
        }
      )}
      style={initiativesSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
    >
      <Tabs
        tabs={INITIATIVE_DETAILS_SIDEBAR_TABS}
        storageKey={`initiative-detail-sidebar-${initiativeId}`}
        defaultTab="properties"
        containerClassName="gap-4"
      />
    </div>
  );
});
