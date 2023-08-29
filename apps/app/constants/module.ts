// types
import { TModuleStatus } from "types";

export const MODULE_STATUS: {
  label: string;
  value: TModuleStatus;
  color: string;
}[] = [
  { label: "Backlog", value: "backlog", color: "#a3a3a2" },
  { label: "Planned", value: "planned", color: "#3f76ff" },
  { label: "In Progress", value: "in-progress", color: "#f39e1f" },
  { label: "Paused", value: "paused", color: "#525252" },
  { label: "Completed", value: "completed", color: "#16a34a" },
  { label: "Cancelled", value: "cancelled", color: "#ef4444" },
];
