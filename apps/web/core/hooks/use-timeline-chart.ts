import { useContext } from "react";
// types
import { GANTT_TIMELINE_TYPE } from "@plane/types";
import type { TTimelineType } from "@plane/types";
// lib
import { StoreContext } from "@/lib/store-context";
// Plane-web
import type { ITimelineStore } from "@/plane-web/store/timeline";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { useTimeLineType } from "../components/gantt-chart/contexts";

const TIMELINE_STORE_MAP: Record<TTimelineType, keyof ITimelineStore> = {
  [GANTT_TIMELINE_TYPE.ISSUE]: "issuesTimeLineStore",
  [GANTT_TIMELINE_TYPE.MODULE]: "modulesTimeLineStore",
  [GANTT_TIMELINE_TYPE.PROJECT]: "projectTimeLineStore",
  [GANTT_TIMELINE_TYPE.GROUPED]: "groupedTimeLineStore",
};

export const useTimeLineChart = (timelineType: TTimelineType): IBaseTimelineStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTimeLineChart must be used within StoreProvider");

  const storeKey = TIMELINE_STORE_MAP[timelineType];
  return context.timelineStore[storeKey] as IBaseTimelineStore;
};

export const useTimeLineChartStore = (): IBaseTimelineStore => {
  const context = useContext(StoreContext);
  const timelineType = useTimeLineType();

  if (!context) throw new Error("useTimeLineChartStore must be used within StoreProvider");
  if (!timelineType) throw new Error("useTimeLineChartStore must be used within TimeLineTypeContext");

  return useTimeLineChart(timelineType);
};
