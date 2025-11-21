import React from "react";
// helpers
import { cn } from "../utils/classname";

export type SkeletonProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export type SkeletonItemProps = {
  height?: string;
  width?: string;
  className?: string;
};

function SkeletonRoot({ children, className = "", ariaLabel = "Loading content" }: SkeletonProps) {
  return (
    <div data-slot="skeleton" className={cn("animate-pulse", className)} role="status" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

function SkeletonItem({ height = "auto", width = "auto", className = "" }: SkeletonItemProps) {
  return (
    <div
      data-slot="skeleton-item"
      className={cn("rounded-md bg-custom-background-80", className)}
      style={{ height, width }}
    />
  );
}

SkeletonRoot.displayName = "plane-ui-skeleton";
SkeletonItem.displayName = "plane-ui-skeleton-item";

export { SkeletonRoot as Skeleton, SkeletonItem };
