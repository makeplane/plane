import React from "react";
// ui
import { Loader } from "@plane/ui";
import { InboxSidebarLoader } from "./inbox-sidebar-loader";

export const InboxLayoutLoader = () => (
  <div className="relative w-full h-full flex overflow-hidden">
    <InboxSidebarLoader />
    <div className="w-4/6">
      <Loader className="flex flex-col h-full gap-5 p-5">
        <div className="space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
          <Loader.Item height="15px" width="60%" />
          <Loader.Item height="15px" width="40%" />
        </div>
        <Loader.Item height="150px" />
      </Loader>
    </div>
  </div>
);
