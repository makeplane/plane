"use client";

// ui
import { Loader } from "@plane/ui";

export const IssuesByPriorityWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl p-6">
    <Loader.Item height="17px" width="35%" />
    <div className="flex items-center gap-1 h-full">
      <Loader.Item height="119px" width="14%" />
      <Loader.Item height="119px" width="26%" />
      <Loader.Item height="119px" width="36%" />
      <Loader.Item height="119px" width="18%" />
      <Loader.Item height="119px" width="6%" />
    </div>
  </Loader>
);
