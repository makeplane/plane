/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// types
import { GANTT_TIMELINE_TYPE, type TTimelineTypeCore, type TTimelineType } from "@plane/types";
// lib
import { StoreContext } from "@/lib/store-context";
import type { IBaseTimelineStore } from "@/store/timeline/base-timeline.store";
import type { ITimelineStore } from "@/store/timeline/timeline.store";
import { useTimeLineType } from "../components/gantt-chart/contexts";

export const getTimelineStore = (
  timelineStore: ITimelineStore,
  timelineType: TTimelineTypeCore
): IBaseTimelineStore => {
  if (timelineType === GANTT_TIMELINE_TYPE.ISSUE) {
    return timelineStore.issuesTimeLineStore as IBaseTimelineStore;
  }
  if (timelineType === GANTT_TIMELINE_TYPE.MODULE) {
    return timelineStore.modulesTimeLineStore as IBaseTimelineStore;
  }
  if (timelineType === GANTT_TIMELINE_TYPE.PROJECT) {
    return timelineStore.projectTimeLineStore;
  }
  if (timelineType === GANTT_TIMELINE_TYPE.GROUPED) {
    return timelineStore.groupedTimeLineStore;
  }
  throw new Error(`Unknown timeline type: ${timelineType}`);
};

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
