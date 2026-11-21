/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

/** Mirrors the project card: cover with logo and actions, name and identifier, lead row, footer. */
function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-subtle-1 bg-layer-2">
      <div className="relative h-[108px] w-full bg-layer-1">
        <span className="absolute top-3 left-3 size-9 rounded-md bg-layer-3" />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="size-6 rounded-md bg-layer-3" />
          <span className="size-6 rounded-md bg-layer-3" />
        </div>
      </div>
      <div className="space-y-4 px-3 pt-1.5 pb-3">
        <div className="space-y-1.5">
          <span className="block h-4 w-32 rounded-sm bg-layer-1" />
          <span className="block h-3 w-16 rounded-sm bg-layer-1" />
        </div>
        <span className="block h-4 w-36 rounded-sm bg-layer-1" />
      </div>
      <div className="flex items-center justify-between border-t border-subtle p-3">
        <span className="h-6 w-16 rounded-sm bg-layer-1" />
        <span className="h-5 w-12 rounded-full bg-layer-1" />
      </div>
    </div>
  );
}

export function ProjectsLoader() {
  return (
    <div className="h-full w-full animate-pulse overflow-y-auto px-page-x py-page-y">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {range(6).map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
