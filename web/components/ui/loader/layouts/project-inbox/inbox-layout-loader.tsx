import React from "react";
// ui
import { InboxSidebarLoader } from "./inbox-sidebar-loader";

export const InboxLayoutLoader = () => (
  <div className="relative flex h-full overflow-hidden">
    <InboxSidebarLoader />
    <div className="w-full">
      <div className="grid h-full place-items-center p-4 text-custom-text-200">
        <div className="grid h-full place-items-center">
          <div className="my-5 flex flex-col items-center gap-4">
            <span className="h-[60px] w-[60px] bg-custom-background-80 rounded" />
            <span className="h-6 w-96 bg-custom-background-80 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
