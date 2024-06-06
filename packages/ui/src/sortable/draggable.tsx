import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isEqual } from "lodash";
import { cn } from "../../helpers";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "../drop-indicator";

type Props = {
  children: React.ReactNode;
  data: any; //@todo make this generic
  className?: string;
};
const Draggable = ({ children, data, className }: Props) => {
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
          onDragEnter: (args) => {
            setIsDraggedOver(true);
            setClosestEdge(extractClosestEdge(args.self.data));
          },
          onDragLeave: () => setIsDraggedOver(false),
          onDrop: () => {
            setIsDraggedOver(false);
          },
          canDrop: ({ source }) => !isEqual(source.data, data) && source.data.__uuid__ === data.__uuid__,
          getData: ({ input, element }) =>
            attachClosestEdge(data, {
              input,
              element,
              allowedEdges: ["top", "bottom"],
            }),
        })
      );
    }
  }, [data]);

  return (
    <div ref={ref} className={cn(dragging && "opacity-25", className)}>
      {<DropIndicator isVisible={isDraggedOver && closestEdge === "top"} />}
      {children}
      {<DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />}
    </div>
  );
};

export { Draggable };
