"use client";

import React, { FC } from "react";
// utils
import { cn } from "@plane/utils";

type TLayoutRootProps = {
  children: React.ReactNode;
  className?: string;
  emptyStateComponent?: React.ReactNode;
  renderEmptyState?: boolean;
};

export const LayoutRoot: FC<TLayoutRootProps> = (props) => {
  const { children, className = "", renderEmptyState, emptyStateComponent } = props;
  return (
    <div className={cn("flex h-full w-full overflow-hidden", className)}>
      {renderEmptyState ? emptyStateComponent : children}
    </div>
  );
};
