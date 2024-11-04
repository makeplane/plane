import { RefObject } from "react";
import { IGanttBlock } from "@/components/gantt-chart";

type LeftDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};

export const LeftDependencyDraggable = (props: LeftDependencyDraggableProps) => <></>;
