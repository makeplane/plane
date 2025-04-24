export interface IStateGroupIcon {
  className?: string;
  color?: string;
  stateGroup: TStateGroups;
  size?: "sm" | "md" | "lg" | "xl";
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

export const STATE_GROUP_SIZES = {
  sm: "12px",
  md: "14px",
  lg: "16px",
  xl: "18px",
};
