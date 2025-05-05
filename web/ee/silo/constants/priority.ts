import { E_PLANE_PRIORITY, TPlanePriorityData } from "@/plane-web/silo/types/common";

export const PLANE_PRIORITIES: TPlanePriorityData[] = [
  {
    key: E_PLANE_PRIORITY.URGENT,
    label: "Urgent",
  },
  {
    key: E_PLANE_PRIORITY.HIGH,
    label: "High",
  },
  {
    key: E_PLANE_PRIORITY.MEDIUM,
    label: "Medium",
  },
  {
    key: E_PLANE_PRIORITY.LOW,
    label: "Low",
  },
  {
    key: E_PLANE_PRIORITY.NONE,
    label: "None",
  },
];
