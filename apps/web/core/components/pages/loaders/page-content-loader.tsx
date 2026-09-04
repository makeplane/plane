/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
};

export function PageContentLoader(props: Props) {
  const { className } = props;

  return (
    <div className={cn("relative flex size-full flex-col", className)}>
      {/* header */}
      <div className="relative flex h-12 w-full flex-shrink-0 items-center divide-x divide-subtle border-b border-subtle">
        <Skeleton aria-label="Loading page content">
          <div className="relative flex items-center gap-1 pr-2">
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
          </div>
        </Skeleton>
        <Skeleton aria-label="Loading page content">
          <div className="relative flex items-center gap-1 px-2">
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
          </div>
        </Skeleton>
        <Skeleton aria-label="Loading page content">
          <div className="relative flex items-center gap-1 px-2">
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
          </div>
        </Skeleton>
        <Skeleton aria-label="Loading page content">
          <div className="relative flex items-center gap-1 pl-2">
            <SkeletonItem blockSize="26px" inlineSize="26px" />
            <SkeletonItem blockSize="26px" inlineSize="26px" />
          </div>
        </Skeleton>
      </div>

      {/* content */}
      <div className="relative flex size-full overflow-hidden pt-[64px]">
        {/* editor loader */}
        <div className="size-full py-5">
          <Skeleton aria-label="Loading page content">
            <div className="relative space-y-4">
              <SkeletonItem blockSize="36px" inlineSize="50%" />
              <div className="space-y-2">
                <div className="py-2">
                  <SkeletonItem blockSize="36px" />
                </div>
                <SkeletonItem blockSize="22px" inlineSize="80%" />
                <div className="relative flex items-center gap-2">
                  <SkeletonItem blockSize="30px" inlineSize="30px" />
                  <SkeletonItem blockSize="22px" inlineSize="30%" />
                </div>
                <div className="py-2">
                  <SkeletonItem blockSize="36px" inlineSize="60%" />
                </div>
                <SkeletonItem blockSize="22px" inlineSize="70%" />
                <SkeletonItem blockSize="22px" inlineSize="30%" />
                <div className="relative flex items-center gap-2">
                  <SkeletonItem blockSize="30px" inlineSize="30px" />
                  <SkeletonItem blockSize="22px" inlineSize="30%" />
                </div>
                <div className="py-2">
                  <SkeletonItem blockSize="30px" inlineSize="50%" />
                </div>
                <SkeletonItem blockSize="22px" />
                <div className="py-2">
                  <SkeletonItem blockSize="30px" inlineSize="30%" />
                </div>
                <SkeletonItem blockSize="22px" inlineSize="30%" />
                <div className="relative flex items-center gap-2">
                  <div className="py-2">
                    <SkeletonItem blockSize="30px" inlineSize="30px" />
                  </div>
                  <SkeletonItem blockSize="22px" inlineSize="30%" />
                </div>
              </div>
            </div>
          </Skeleton>
        </div>
      </div>
    </div>
  );
}
