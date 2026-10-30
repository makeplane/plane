/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader } from "@plane/blocks/skeleton";
import { cn } from "@plane/utils";
// local imports
import { ANALYTICS_CHART_HEIGHT_CLASSNAME } from "./constants";

export function ProjectInsightsLoader() {
  return (
    <div className={cn(ANALYTICS_CHART_HEIGHT_CLASSNAME, "gap-8 xl:flex")}>
      <Loader className="h-full w-full xl:w-3/5">
        <Loader.Item height="100%" width="100%" />
      </Loader>
      <div className="hidden h-full w-full flex-col gap-4 xl:flex xl:w-2/5">
        <Loader className="w-full">
          <Loader.Item height="20px" width="60%" />
        </Loader>
        <Loader className="flex w-full flex-col gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            // oxlint-disable-next-line react/no-array-index-key
            <Loader.Item key={index} height="16px" width="100%" />
          ))}
        </Loader>
      </div>
    </div>
  );
}

export function ChartLoader() {
  return (
    <Loader className={cn(ANALYTICS_CHART_HEIGHT_CLASSNAME, "w-full")}>
      <Loader.Item height="100%" width="100%" />
    </Loader>
  );
}
