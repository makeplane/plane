/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
import { DragHandle } from "@plane/ui";
// helper
import { cn } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  sort_order: number | null;
  isDragging: boolean;
};

export const FavoriteItemDragHandle = observer(function FavoriteItemDragHandle(props: Props) {
  const { sort_order, isDragging } = props;
  // store hooks
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
      position="top-end"
      disabled={isDragging}
    >
      <div
        className={cn(
          "absolute top-1/2 -left-3 hidden -translate-y-1/2 cursor-grab items-center justify-center rounded-sm text-placeholder group-hover/project-item:flex",
          {
            "cursor-not-allowed opacity-60": sort_order === null,
            "cursor-grabbing": isDragging,
          }
        )}
      >
        <DragHandle className="bg-transparent" />
      </div>
    </Tooltip>
  );
});
