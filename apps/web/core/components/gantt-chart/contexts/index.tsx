import { createContext, useContext } from "react";
import type { TTimelineType } from "@plane/types";

export const TimeLineTypeContext = createContext<TTimelineType | undefined>(undefined);

export const useTimeLineType = () => {
  const timelineType = useContext(TimeLineTypeContext);
  return timelineType;
};
