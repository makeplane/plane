"use client";

// plane imports
import { Loader } from "@plane/ui";

export const DashboardsListLayoutLoader = () => (
  <div className="size-full">
    {Array.from({ length: 10 }).map((_, index) => (
      <Loader key={index} className="relative flex items-center gap-2 p-3 py-4 border-b border-custom-border-100">
        <Loader.Item width={`${250 + 10 * Math.floor(Math.random() * 10)}px`} height="22px" />
        <div className="ml-auto relative flex items-center gap-2">
          <Loader.Item width="60px" height="22px" />
          <Loader.Item width="22px" height="22px" />
          <Loader.Item width="22px" height="22px" />
          <Loader.Item width="22px" height="22px" />
        </div>
      </Loader>
    ))}
  </div>
);
