"use client";

import range from "lodash/range";
// ui
import { Loader } from "@plane/ui";

export const RecentProjectsWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl p-6 space-y-6">
    <Loader.Item height="17px" width="35%" />
    {range(5).map((index) => (
      <div key={index} className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <Loader.Item height="60px" width="60px" />
        </div>
        <div className="space-y-3 flex-shrink-0 w-full">
          <Loader.Item height="17px" width="42%" />
          <Loader.Item height="23px" width="10%" />
        </div>
      </div>
    ))}
  </Loader>
);
