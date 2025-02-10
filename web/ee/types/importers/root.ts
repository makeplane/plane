// plane priority
export enum E_PLANE_PRIORITY {
  URGENT = "urgent",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  NONE = "none",
}

export type TPlanePriority =
  | E_PLANE_PRIORITY.URGENT
  | E_PLANE_PRIORITY.HIGH
  | E_PLANE_PRIORITY.MEDIUM
  | E_PLANE_PRIORITY.LOW
  | E_PLANE_PRIORITY.NONE;

export type TPlanePriorityData = {
  key: TPlanePriority;
  label: string;
};
