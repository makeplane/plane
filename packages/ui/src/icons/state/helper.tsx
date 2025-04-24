import { EIconSize } from "@plane/constants";

export interface IStateGroupIcon {
  className?: string;
  color?: string;
  stateGroup: TStateGroups;
  size?: EIconSize;
  percentage?: number;
}

export type TStateGroups = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export const STATE_GROUP_COLORS: {
  [key in TStateGroups]: string;
} = {
  backlog: "#60646C",
  unstarted: "#60646C",
  started: "#F59E0B",
  completed: "#46A758",
  cancelled: "#9AA4BC",
};

export const STATE_GROUP_SIZES: {
  [key in EIconSize]: string;
} = {
  [EIconSize.XS]: "10px",
  [EIconSize.SM]: "12px",
  [EIconSize.MD]: "14px",
  [EIconSize.LG]: "16px",
  [EIconSize.XL]: "18px",
};
