/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowNarrowRightOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssuePeekOverviewLoader = {
  removeRoutePeekId: () => void;
};

export function IssuePeekOverviewLoader(props: TIssuePeekOverviewLoader) {
  const { removeRoutePeekId } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <Skeleton aria-label="Loading work item">
      <div className="h-screen w-full space-y-6 overflow-hidden p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tooltip label="Close the peek view" disabled={isMobile}>
              <button onClick={removeRoutePeekId}>
                <ArrowNarrowRightOutline className="h-4 w-4 text-tertiary hover:text-secondary" />
              </button>
            </Tooltip>
            <SkeletonItem blockSize="30px" inlineSize="30px" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonItem blockSize="30px" inlineSize="80px" />
            <SkeletonItem blockSize="30px" inlineSize="30px" />
            <SkeletonItem blockSize="30px" inlineSize="30px" />
            <SkeletonItem blockSize="30px" inlineSize="30px" />
          </div>
        </div>

        {/* issue title and description and comments */}
        <div className="space-y-3">
          <SkeletonItem blockSize="20px" inlineSize="100px" />

          <div className="space-y-1">
            <SkeletonItem blockSize="15px" inlineSize="300px" />
            <SkeletonItem blockSize="15px" inlineSize="400px" />
            <div className="flex items-center gap-2">
              <SkeletonItem blockSize="15px" inlineSize="20px" />
              <SkeletonItem blockSize="15px" inlineSize="500px" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonItem blockSize="15px" inlineSize="20px" />
              <SkeletonItem blockSize="15px" inlineSize="200px" />
            </div>
            <SkeletonItem blockSize="15px" inlineSize="300px" />
            <SkeletonItem blockSize="15px" inlineSize="200px" />
          </div>

          <SkeletonItem blockSize="30px" inlineSize="30px" />
        </div>

        {/* sub issues */}
        <div className="flex items-center justify-between gap-2">
          <SkeletonItem blockSize="20px" inlineSize="80px" />
          <SkeletonItem blockSize="20px" inlineSize="100px" />
        </div>

        {/* attachments */}
        <div className="space-y-3">
          <SkeletonItem blockSize="20px" inlineSize="80px" />
          <div className="flex items-center gap-2">
            <SkeletonItem blockSize="50px" inlineSize="250px" />
            <SkeletonItem blockSize="50px" inlineSize="250px" />
          </div>
        </div>

        {/* properties */}
        <div className="space-y-3">
          <SkeletonItem blockSize="20px" inlineSize="80px" />
          <div className="space-y-2">
            <div className="flex items-center gap-8">
              <SkeletonItem blockSize="25px" inlineSize="150px" />
              <SkeletonItem blockSize="25px" inlineSize="150px" />
            </div>
            <div className="flex items-center gap-8">
              <SkeletonItem blockSize="25px" inlineSize="150px" />
              <SkeletonItem blockSize="25px" inlineSize="150px" />
            </div>
            <div className="flex items-center gap-8">
              <SkeletonItem blockSize="25px" inlineSize="150px" />
              <SkeletonItem blockSize="25px" inlineSize="150px" />
            </div>
            <div className="flex items-center gap-8">
              <SkeletonItem blockSize="25px" inlineSize="150px" />
              <SkeletonItem blockSize="25px" inlineSize="150px" />
            </div>
            <div className="flex items-center gap-8">
              <SkeletonItem blockSize="25px" inlineSize="150px" />
              <SkeletonItem blockSize="25px" inlineSize="150px" />
            </div>
            <div className="flex items-center gap-8">
              <SkeletonItem blockSize="25px" inlineSize="150px" />
              <SkeletonItem blockSize="25px" inlineSize="150px" />
            </div>
          </div>
        </div>
      </div>
    </Skeleton>
  );
}
