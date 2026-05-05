export type TProgressStatus = "off_track" | "due_today" | "at_risk" | "on_track";

export type TProgressStatusResult = {
  label: string;
  status: TProgressStatus;
  // text color (hex) — used via inline style to avoid Tailwind purge
  color: string;
  // background color (hex with alpha) — used via inline style
  bgColor: string;
  // border color (hex with alpha) — used via inline style
  borderColor: string;
  /** @deprecated use color/bgColor/borderColor inline styles instead */
  className: string;
  /** @deprecated use color/bgColor/borderColor inline styles instead */
  bgClassName: string;
};

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
      color: "#ef4444",
      bgColor: "rgba(239,68,68,0.1)",
      borderColor: "rgba(239,68,68,0.3)",
      className: "text-status-red",
      bgClassName: "bg-red-100/60 border-red-200",
    };
  if (diffDays === 0)
    return {
      label: "Due Today",
      status: "due_today",
      color: "#ef4444",
      bgColor: "rgba(239,68,68,0.1)",
      borderColor: "rgba(239,68,68,0.3)",
      className: "text-status-red",
      bgClassName: "bg-red-100/60 border-red-200",
    };
  if (diffDays === 1)
    return {
      label: "At Risk",
      status: "at_risk",
      color: "#f59e0b",
      bgColor: "rgba(245,158,11,0.1)",
      borderColor: "rgba(245,158,11,0.3)",
      className: "text-status-amber",
      bgClassName: "bg-amber-100/60 border-amber-200",
    };
  return {
    label: "On Track",
    status: "on_track",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.3)",
    className: "text-status-green",
    bgClassName: "bg-green-100/60 border-green-200",
  };
}
