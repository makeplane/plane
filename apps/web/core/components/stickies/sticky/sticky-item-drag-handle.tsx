/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { DragHandle } from "@plane/ui";
// helper
import { cn } from "@plane/utils";

type Props = {
  isDragging: boolean;
};

export const StickyItemDragHandle = observer(function StickyItemDragHandle(props: Props) {
  const { isDragging } = props;

  return (
    <div
      className={cn(
        "absolute top-3 left-1/2 mr-2 hidden -translate-x-1/2 rotate-90 cursor-grab items-center justify-center rounded-sm text-placeholder group-hover/sticky:flex",
        {
          "cursor-grabbing": isDragging,
        }
      )}
    >
      <DragHandle className="bg-transparent" />
    </div>
  );
});
