"use client";

// ui
import { Loader } from "@plane/ui";

export const OverviewStatsWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl py-6 grid grid-cols-4 gap-36 px-12">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="space-y-3">
        <Loader.Item height="11px" width="50%" />
        <Loader.Item height="15px" />
      </div>
    ))}
  </Loader>
);
