import React from "react";
// helpers
import { cn } from "../utils/classname";

type SkeletonProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

function SkeletonRoot({ children, className = "", ariaLabel = "Loading content" }: SkeletonProps) {
  return (
    <div data-slot="skeleton" className={cn("animate-pulse", className)} role="status" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

type ItemProps = {
  height?: string;
  width?: string;
  className?: string;
};

function SkeletonItem({ height = "auto", width = "auto", className = "" }: ItemProps) {
  return <div data-slot="skeleton-item" className={cn("rounded-md bg-layer-1", className)} style={{ height, width }} />;
}

const Skeleton = Object.assign(SkeletonRoot, { Item: SkeletonItem });

SkeletonRoot.displayName = "plane-ui-skeleton";
SkeletonItem.displayName = "plane-ui-skeleton-item";

export { Skeleton, SkeletonRoot, SkeletonItem };
