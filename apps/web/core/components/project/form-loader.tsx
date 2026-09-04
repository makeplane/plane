/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";

export function ProjectDetailsFormLoader() {
  return (
    <>
      <div className="relative mt-6 h-44 w-full">
        <Skeleton aria-label="Loading project form">
          <SkeletonItem inlineSize="46px" />
        </Skeleton>
        <div className="absolute bottom-4 flex w-full items-end justify-between gap-3 px-4">
          <div className="flex flex-grow gap-3 truncate">
            <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-lg bg-surface-2">
              <Skeleton aria-label="Loading project form">
                <SkeletonItem blockSize="46px" inlineSize="46px" />
              </Skeleton>
            </div>
          </div>
          <div className="flex flex-shrink-0 justify-center">
            <Skeleton aria-label="Loading project form">
              <SkeletonItem blockSize="32px" inlineSize="108px" />
            </Skeleton>
          </div>
        </div>
      </div>
      <div className="my-8 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h4 className="text-13">Project name</h4>
          <Skeleton aria-label="Loading project form">
            <SkeletonItem blockSize="46px" />
          </Skeleton>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-13">Description</h4>
          <Skeleton aria-label="Loading project form">
            <div className="w-full">
              <SkeletonItem blockSize="102px" inlineSize="full" />
            </div>
          </Skeleton>
        </div>
        <div className="flex w-full items-center justify-between gap-10">
          <div className="flex w-1/2 flex-col gap-1">
            <h4 className="text-13">Identifier</h4>
            <Skeleton aria-label="Loading project form">
              <SkeletonItem blockSize="36px" />
            </Skeleton>
          </div>
          <div className="flex w-1/2 flex-col gap-1">
            <h4 className="text-13">Network</h4>
            <Skeleton aria-label="Loading project form">
              <div className="w-full">
                <SkeletonItem blockSize="46px" />
              </div>
            </Skeleton>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <Skeleton aria-label="Loading project form">
            <div className="mt-2 w-full">
              <SkeletonItem blockSize="34px" inlineSize="100px" />
            </div>
          </Skeleton>
        </div>
      </div>
    </>
  );
}
