/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MoreVertical } from "lucide-react";
import React, { forwardRef } from "react";
// helpers
import { cn } from "./utils";

interface IDragHandle extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  disabled?: boolean;
}

export const DragHandle = forwardRef(function DragHandle(
  props: IDragHandle,
  ref: React.ForwardedRef<HTMLButtonElement | null>
) {
  const { className, disabled = false, "aria-label": ariaLabel = "Drag to reorder", ...rest } = props;

  if (disabled) {
    return <div className="h-[18px] w-[14px]" />;
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-shrink-0 cursor-grab rounded-sm bg-surface-2 p-0.5 text-secondary transition-colors focus-visible:ring-1 focus-visible:ring-accent-strong focus-visible:outline-none",
        className
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
      {...rest}
    >
      <MoreVertical className="h-3.5 w-3.5 stroke-placeholder" />
      <MoreVertical className="-ml-5 h-3.5 w-3.5 stroke-placeholder" />
    </button>
  );
});

DragHandle.displayName = "DragHandle";
