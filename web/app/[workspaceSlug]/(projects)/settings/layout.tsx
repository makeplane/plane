"use client";

import { ReactNode } from "react";
// components
import { AppHeader } from "@/components/core";
// plane web components
// import { LicenseSeatsBanner } from "@/plane-web/components/license";
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
      <div className="w-full h-full overflow-hidden">
        {/* free banner */}
        <div className="flex-shrink-0">{/* <LicenseSeatsBanner /> */}</div>
        {/* workspace settings */}
        <div className="w-full h-full overflow-hidden">
          <MobileWorkspaceSettingsTabs />
          <div className="inset-y-0 flex flex-row vertical-scrollbar scrollbar-lg h-full w-full overflow-y-auto">
            <div className="px-page-x !pr-0 py-page-y flex-shrink-0 overflow-y-hidden sm:hidden hidden md:block lg:block">
              <WorkspaceSettingsSidebar />
            </div>
            <div className="flex flex-col relative w-full overflow-hidden">
              <div className="w-full h-full overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-page-x md:px-9 py-page-y">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
