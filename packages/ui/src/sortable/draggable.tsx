/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// @ts-expect-error Due to live server dependencies
import { combine } from "@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/combine.js";
import {
  draggable,
  dropTargetForElements,
  // @ts-expect-error Due to live server dependencies
} from "@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/element/adapter.js";
import {
  attachClosestEdge,
  extractClosestEdge,
  // @ts-expect-error Due to live server dependencies
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/cjs/closest-edge.js";
import { isEqual } from "lodash-es";
import React, { useEffect, useRef, useState } from "react";
import { DropIndicator } from "../drop-indicator";
import { cn } from "../utils";

type Props = {
  children: React.ReactNode;
  data: any; //@todo make this generic
  className?: string;
  allowExternalDrop?: boolean;
  onExternalDrop?: (externalData: any, position: "top" | "bottom") => void;
};

function Draggable({ children, data, className, allowExternalDrop, onExternalDrop }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false); // NEW
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const [closestEdge, setClosestEdge] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;

    if (el) {
      combine(
        draggable({
          element: el,
          onDragStart: () => setDragging(true), // NEW
          onDrop: () => setDragging(false), // NEW
          getInitialData: () => data,
        }),
        dropTargetForElements({
          element: el,
          // @ts-expect-error Due to live server dependencies
          onDragEnter: (args) => {
            setIsDraggedOver(true);
            setClosestEdge(extractClosestEdge(args.self.data));
          },
          onDragLeave: () => {
            setIsDraggedOver(false);
            setClosestEdge(null);
          },
          // @ts-expect-error Due to live server dependencies
          onDrop: (args) => {
            setIsDraggedOver(false);
            setClosestEdge(null);

            // Handle external drops
            if (args.source.data.isExternal && onExternalDrop) {
              const edge = extractClosestEdge(args.self.data);
              onExternalDrop(args.source.data, edge as "top" | "bottom");
            }
          },
          // @ts-expect-error Due to live server dependencies
          canDrop: ({ source }) => {
            // Allow external drops if enabled
            if (allowExternalDrop && source.data.isExternal) {
              return true;
            }
            // Standard same-list check
            return !isEqual(source.data, data) && source.data.__uuid__ === data.__uuid__;
          },
          // @ts-expect-error Due to live server dependencies
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
