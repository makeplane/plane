// types
import type { TTimelineType } from "@plane/types";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
// Plane-web
import type { ITimelineStore } from "@/plane-web/store/timeline";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";

export const TIMELINE_STORE_MAP: Record<TTimelineType, keyof ITimelineStore> = {
  [GANTT_TIMELINE_TYPE.ISSUE]: "issuesTimeLineStore",
  [GANTT_TIMELINE_TYPE.MODULE]: "modulesTimeLineStore",
  [GANTT_TIMELINE_TYPE.PROJECT]: "projectTimeLineStore",
  [GANTT_TIMELINE_TYPE.GROUPED]: "groupedTimeLineStore",
};

export const getTimelineStore = (timelineStore: ITimelineStore, timelineType: TTimelineType): IBaseTimelineStore => {
  const storeKey = TIMELINE_STORE_MAP[timelineType];
  return timelineStore[storeKey] as IBaseTimelineStore;
};
