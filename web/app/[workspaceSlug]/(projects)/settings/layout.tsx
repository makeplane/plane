"use client";

import { ReactNode } from "react";
// components
import { ContentWrapper } from "@plane/ui";
import { AppHeader } from "@/components/core";
// local components
import { WorkspaceSettingHeader } from "./header";
import { MobileWorkspaceSettingsTabs } from "./mobile-header-tabs";
import { WorkspaceSettingsSidebar } from "./sidebar";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

export default function WorkspaceSettingLayout(props: IWorkspaceSettingLayout) {
  const { children } = props;

  return (
    <>
      <AppHeader header={<WorkspaceSettingHeader />} />
      <ContentWrapper className="flex-row inset-y-0 z-20 flex h-full w-full gap-4">
        <div className="w-80 flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
          <WorkspaceSettingsSidebar />
        </div>
        <div className="flex flex-col relative w-full overflow-hidden">
          <MobileWorkspaceSettingsTabs />
          <div className="w-full pl-4 md:pl-0 overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">
            {children}
          </div>
        </div>
      </ContentWrapper>
    </>
  );
}
