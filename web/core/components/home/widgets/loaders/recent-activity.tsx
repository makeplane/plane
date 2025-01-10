"use client";

import range from "lodash/range";
// ui
import { Loader } from "@plane/ui";

export const RecentActivityWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl px-2 space-y-6">
    {range(5).map((index) => (
      <div key={index} className="flex items-start gap-3.5">
        <div className="flex-shrink-0">
          <Loader.Item height="32px" width="32px" />
        </div>
        <div className="space-y-3 flex-shrink-0 w-full my-auto">
          <Loader.Item height="15px" width="70%" />
        </div>
      </div>
    ))}
  </Loader>
);
