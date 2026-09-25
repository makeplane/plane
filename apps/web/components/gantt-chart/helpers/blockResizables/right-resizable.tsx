/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane utils
import { cn, renderFormattedDate } from "@plane/utils";
//helpers
//
//hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type RightResizableProps = {
  enableBlockRightResize: boolean;
  handleBlockDrag: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, dragDirection: "left" | "right" | "move") => void;
  isMoving: "left" | "right" | "move" | undefined;
  position?: {
    marginLeft: number;
    width: number;
  };
};
export const RightResizable = observer(function RightResizable(props: RightResizableProps) {
  const { enableBlockRightResize, handleBlockDrag, isMoving, position } = props;
  const [isHovering, setIsHovering] = useState(false);

  const { getDateFromPositionOnGantt } = useTimeLineChartStore();

  const date = position ? getDateFromPositionOnGantt(position.marginLeft + position.width, -1) : undefined;
  const dateString = date ? renderFormattedDate(date) : undefined;

  const isRightResizing = isMoving === "right" || isMoving === "move";

  if (!enableBlockRightResize) return null;

  return (
    <>
      {(isHovering || isRightResizing) && dateString && (
        <div className="absolute -right-36 z-[10] flex h-full w-32 items-center justify-start text-11 font-regular text-tertiary">
          <div className="rounded-sm bg-accent-subtle px-2 py-1">{dateString}</div>
        </div>
      )}
      <div
        onMouseDown={(e) => handleBlockDrag(e, "right")}
        onMouseOver={() => {
          setIsHovering(true);
        }}
        onMouseOut={() => {
          setIsHovering(false);
        }}
        className="absolute top-1/2 -right-1.5 z-[6] h-full w-3 -translate-y-1/2 cursor-col-resize rounded-md"
      />
      <div
        className={cn(
          "absolute top-1/2 right-1 z-[5] h-7 w-1 -translate-y-1/2 rounded-xs bg-surface-1 opacity-0 transition-all duration-300 group-hover:opacity-100",
          {
            "-right-1.5 opacity-100": isRightResizing,
          }
        )}
      />
    </>
  );
});
