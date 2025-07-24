import React, { RefObject } from "react";
import { observer } from "mobx-react";
// hooks
import type { IGanttBlock } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
//  Plane-web
import { LeftDependencyDraggable, RightDependencyDraggable } from "@/plane-web/components/gantt-chart";
//
import { LeftResizable } from "./blockResizables/left-resizable";
import { RightResizable } from "./blockResizables/right-resizable";

type Props = {
  block: IGanttBlock;
  blockToRender: (data: any) => React.ReactNode;
  handleBlockDrag: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, dragDirection: "left" | "right" | "move") => void;
  isMoving: "left" | "right" | "move" | undefined;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableDependency: boolean | ((blockId: string) => boolean);
  ganttContainerRef: RefObject<HTMLDivElement>;
};

export const ChartDraggable: React.FC<Props> = observer((props) => {
  const {
    block,
    blockToRender,
    handleBlockDrag,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableDependency,
    isMoving,
    ganttContainerRef,
  } = props;

  return (
    <div className="group w-full z-[5] relative inline-flex h-full cursor-pointer items-center font-medium transition-all">
      {/* left resize drag handle */}
      {(typeof enableDependency === "function" ? enableDependency(block.id) : enableDependency) && (
        <LeftDependencyDraggable block={block} ganttContainerRef={ganttContainerRef} />
      )}
      <LeftResizable
        enableBlockLeftResize={enableBlockLeftResize}
        handleBlockDrag={handleBlockDrag}
        isMoving={isMoving}
        position={block.position}
      />
      <div
        className={cn("relative z-[6] flex h-8 w-full items-center rounded", {
          "pointer-events-none": isMoving,
        })}
        onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}
      >
        {blockToRender({ ...block.data, meta: block.meta })}
      </div>
      {/* right resize drag handle */}
      <RightResizable
        enableBlockRightResize={enableBlockRightResize}
        handleBlockDrag={handleBlockDrag}
        isMoving={isMoving}
        position={block.position}
      />
      {(typeof enableDependency === "function" ? enableDependency(block.id) : enableDependency) && (
        <RightDependencyDraggable block={block} ganttContainerRef={ganttContainerRef} />
      )}
    </div>
  );
});
