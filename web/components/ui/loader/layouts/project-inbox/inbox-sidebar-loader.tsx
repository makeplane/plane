import React from "react";

export const InboxSidebarLoader = () => (
  <div className="h-full w-[340px] border-r border-custom-border-300">
    <div className="flex-shrink-0 w-full h-[50px] relative flex justify-between items-center gap-2 p-2 px-3 border-b border-custom-border-300">
      <span className="h-6 w-16 bg-custom-background-80 rounded" />
      <span className="h-6 w-16 bg-custom-background-80 rounded" />
    </div>
    <div className="flex flex-col">
      {[...Array(6)].map(() => (
        <div className="flex flex-col gap-3 h-[5rem]space-y-3 border-b border-custom-border-200 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="h-5 w-20 bg-custom-background-80 rounded" />
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 bg-custom-background-80 rounded" />
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
