import React from "react";

export const InboxSidebarLoader = () => (
  <div className="flex-shrink-0 w-2/6 h-full border-r border-custom-border-300">
    <div className="flex flex-col">
      {[...Array(6)].map((i, index) => (
        <div key={index} className="flex flex-col gap-2.5 h-[105px] space-y-3 border-b border-custom-border-200 p-4">
          <div className="flex flex-col gap-2">
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
            <span className="h-5 w-36 bg-custom-background-80 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-20 bg-custom-background-80 rounded" />
            <span className="h-2 w-2 bg-custom-background-80 rounded-full" />
            <span className="h-4 w-16 bg-custom-background-80 rounded" />
            <span className="h-4 w-16 bg-custom-background-80 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
