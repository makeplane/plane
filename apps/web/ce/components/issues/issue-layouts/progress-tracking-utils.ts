export type TProgressStatus = "off_track" | "due_today" | "at_risk" | "on_track";

export type TProgressStatusResult = { label: string; status: TProgressStatus; className: string; bgClassName: string };

export function getProgressStatus(targetDate: string | null): TProgressStatusResult | null {
  if (!targetDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)
    return {
      label: "Off Track",
      status: "off_track",
      className: "text-status-red",
      bgClassName: "bg-red-100/60 border-red-200",
    };
  if (diffDays === 0)
    return {
      label: "Due Today",
      status: "due_today",
      className: "text-status-red",
      bgClassName: "bg-red-100/60 border-red-200",
    };
  if (diffDays === 1)
    return {
      label: "At Risk",
      status: "at_risk",
      className: "text-status-amber",
      bgClassName: "bg-amber-100/60 border-amber-200",
    };
  return {
    label: "On Track",
    status: "on_track",
    className: "text-status-green",
    bgClassName: "bg-green-100/60 border-green-200",
  };
}
