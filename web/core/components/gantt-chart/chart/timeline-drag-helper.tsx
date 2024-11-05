import { RefObject } from "react";
import { observer } from "mobx-react";
// hooks
import { useAutoScroller } from "@/hooks/use-auto-scroller";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../constants";

type Props = {
  ganttContainerRef: RefObject<HTMLDivElement>;
};
export const TimelineDragHelper = observer((props: Props) => {
  const { ganttContainerRef } = props;
  const { isDragging } = useTimeLineChartStore();

  useAutoScroller(ganttContainerRef, isDragging, SIDEBAR_WIDTH, HEADER_HEIGHT);
  return <></>;
});
