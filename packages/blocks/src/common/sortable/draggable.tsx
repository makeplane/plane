/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { isEqual } from "lodash-es";
import React, { useEffect, useRef, useState } from "react";
import { DropIndicator } from "../drop-indicator";
import { cn } from "@plane/utils";

type Props = {
  children: React.ReactNode;
  data: Record<string | symbol, unknown>;
  className?: string;
  allowExternalDrop?: boolean;
  onExternalDrop?: (externalData: Record<string | symbol, unknown>, position: "top" | "bottom") => void;
};

function Draggable({ children, data, className, allowExternalDrop, onExternalDrop }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false); // NEW
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const [closestEdge, setClosestEdge] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;

    if (el) {
      return combine(
        draggable({
          element: el,
          onDragStart: () => setDragging(true), // NEW
          onDrop: () => setDragging(false), // NEW
          getInitialData: () => data,
        }),
        dropTargetForElements({
          element: el,
          onDragEnter: (args) => {
            setIsDraggedOver(true);
            setClosestEdge(extractClosestEdge(args.self.data));
          },
          onDragLeave: () => {
            setIsDraggedOver(false);
            setClosestEdge(null);
          },
          onDrop: (args) => {
            setIsDraggedOver(false);
            setClosestEdge(null);

            // Handle external drops
            if (args.source.data.isExternal && onExternalDrop) {
              const edge = extractClosestEdge(args.self.data);
              onExternalDrop(args.source.data, edge as "top" | "bottom");
            }
          },
          canDrop: ({ source }) => {
            // Allow external drops if enabled
            if (allowExternalDrop && source.data.isExternal) {
              return true;
            }
            // Standard same-list check
            return !isEqual(source.data, data) && source.data.__uuid__ === data.__uuid__;
          },
          getData: ({ input, element }) =>
            attachClosestEdge(data, {
              input,
              element,
              allowedEdges: ["top", "bottom"],
            }),
        })
      );
    }
  }, [data, allowExternalDrop, onExternalDrop]);

  return (
    <div ref={ref} className={cn(dragging && "opacity-25", className)}>
      {<DropIndicator isVisible={isDraggedOver && closestEdge === "top"} />}
      {children}
      {<DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />}
    </div>
  );
}

export { Draggable };
