import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isEqual } from "lodash";
import { cn } from "../../helpers";

type Props = {
  children: React.ReactNode;
  data: any; //@todo make this generic
  className?: string;
};
const Draggable = ({ children, data, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false); // NEW
  const [isDraggedOver, setIsDraggedOver] = useState(false);

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
          onDragEnter: () => setIsDraggedOver(true),
          onDragLeave: () => setIsDraggedOver(false),
          onDrop: () => setIsDraggedOver(false),
          canDrop: ({ source }) => !isEqual(source.data, data),
          getData: () => data,
        })
      );
    }
  }, [data]);

  return (
    <div ref={ref} className={cn(dragging && "opacity-25", isDraggedOver && "bg-custom-background-80", className)}>
      {children}
    </div>
  );
};

export { Draggable };
