/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MoreVerticalOutline } from "@makeplane/propel/icons";
import React, { forwardRef } from "react";
// helpers
import { cn } from "./utils";

interface IDragHandle {
  className?: string;
  disabled?: boolean;
}

export const DragHandle = forwardRef(function DragHandle(
  props: IDragHandle,
  ref: React.ForwardedRef<HTMLButtonElement | null>
) {
  const { className, disabled = false } = props;

  if (disabled) {
    return <div className="h-[18px] w-[14px]" />;
  }

  return (
    <button
      type="button"
      className={cn("flex flex-shrink-0 cursor-grab rounded-sm bg-surface-2 p-0.5 text-secondary", className)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
    >
      <MoreVerticalOutline className="h-3.5 w-3.5 text-placeholder" />
      <MoreVerticalOutline className="-ml-5 h-3.5 w-3.5 text-placeholder" />
    </button>
  );
});

DragHandle.displayName = "DragHandle";
