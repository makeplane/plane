import { useContext } from "react";
// mobx store
// types
import { StoreContext } from "@/lib/store-context";
import { IBaseTimelineStore } from "ee/store/timeline/base-timeline.store";
import { ETimeLineTypeType, useTimeLineType } from "../components/gantt-chart/contexts";

export const useTimeLineChart = (timeLineType: ETimeLineTypeType): IBaseTimelineStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTimeLineChart must be used within StoreProvider");

  switch (timeLineType) {
    case ETimeLineTypeType.ISSUE:
      return context.timelineStore.issuesTimeLineStore;
    case ETimeLineTypeType.MODULE:
      return context.timelineStore.modulesTimeLineStore;
  }
};

export const useTimeLineChartStore = () => {
  const timelineType = useTimeLineType();

  if (!timelineType) throw new Error("useTimeLineChartStore must be used within TimeLineTypeContext");

  return useTimeLineChart(timelineType);
};
