/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// ui
import { DragHandle } from "@plane/ui";
// helper
import { cn } from "@plane/utils";

type Props = {
  sort_order: number | null;
  isDragging: boolean;
};

export const WidgetItemDragHandle = observer(function WidgetItemDragHandle(props: Props) {
  const { isDragging } = props;

  return (
    <div
      className={cn("mr-2 flex cursor-grab items-center justify-center rounded-sm text-placeholder", {
        "cursor-grabbing": isDragging,
      })}
    >
      <DragHandle className="bg-transparent" />
    </div>
  );
});
