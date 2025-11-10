import { useContext } from "react";
// types
import type { TTimelineType } from "@plane/types";
// lib
import { StoreContext } from "@/lib/store-context";
// Plane-web
import { getTimelineStore } from "@/plane-web/hooks/use-timeline-chart";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { useTimeLineType } from "../components/gantt-chart/contexts";

export const useTimeLineChart = (timelineType: TTimelineType): IBaseTimelineStore => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useTimeLineChart must be used within StoreProvider");

  return getTimelineStore(context.timelineStore, timelineType);
};

export const useTimeLineChartStore = (): IBaseTimelineStore => {
  const context = useContext(StoreContext);
  const timelineType = useTimeLineType();

  if (!context) throw new Error("useTimeLineChartStore must be used within StoreProvider");
  if (!timelineType) throw new Error("useTimeLineChartStore must be used within TimeLineTypeContext");

  return getTimelineStore(context.timelineStore, timelineType);
};
