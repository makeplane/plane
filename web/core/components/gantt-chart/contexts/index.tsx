import { createContext, useContext } from "react";

export const ETimeLineTypeType = {
  ISSUE: "ISSUE",
  MODULE: "MODULE",
  PROJECT: "PROJECT",
} as const;

export type ETimeLineTypeType = typeof ETimeLineTypeType[keyof typeof ETimeLineTypeType];

export const TimeLineTypeContext = createContext<ETimeLineTypeType | undefined>(undefined);

export const useTimeLineType = () => {
  const timelineType = useContext(TimeLineTypeContext);

  return timelineType;
};
