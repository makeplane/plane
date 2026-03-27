import useSWR from "swr";
import { Tooltip } from "@plane/propel/tooltip";
import { UserWorklogService } from "@/plane-web/services/user-worklog.service";
import { Clock } from "lucide-react";

const userWorklogService = new UserWorklogService();

const MAX_MINUTES = 720; // 12 hours

function getProgressColor(totalMinutes: number): { fill: string; bg: string; border: string } {
  const hours = totalMinutes / 60;
  if (hours >= 10) return { fill: "#ef4444", bg: "rgba(239, 68, 68, 0.2)", border: "rgba(239, 68, 68, 0.6)" };
  if (hours >= 8) return { fill: "#22c55e", bg: "rgba(34, 197, 94, 0.2)", border: "rgba(34, 197, 94, 0.6)" };
  if (hours >= 4) return { fill: "#3b82f6", bg: "rgba(59, 130, 246, 0.2)", border: "rgba(59, 130, 246, 0.6)" };
  return { fill: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)", border: "rgba(245, 158, 11, 0.6)" };
}

function formatLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (totalMinutes === 0) return "0h";
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatTooltip(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return `Today: ${parts.length ? parts.join(" ") : "0m"} / 12h`;
}

export function DailyLogtimeIndicator() {
  const { data } = useSWR("USER_DAILY_WORKLOG_TOTAL", () => userWorklogService.getUserDailyTotal(), {
    refreshInterval: 60_000,
  });

  const totalMinutes = data?.total_minutes ?? 0;
  const progress = Math.min(totalMinutes / MAX_MINUTES, 1);
  const color = getProgressColor(totalMinutes);
  const label = formatLabel(totalMinutes);
  const tooltip = formatTooltip(totalMinutes);

  return (
    <Tooltip tooltipContent={tooltip} position="bottom">
      <div
        className="relative flex items-center h-7 px-3 rounded-full cursor-default overflow-hidden"
        style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 transition-all duration-500 ease-in-out"
          style={{ width: `${progress * 100}%`, backgroundColor: color.fill }}
        />
        <div
          className="relative z-10 flex items-center gap-1.5 font-medium whitespace-nowrap"
          style={{ color: "#ffffff", fontSize: "12px" }}
        >
          <Clock className="size-3.5" strokeWidth={2.5} />
          <span>{label} / 12h</span>
        </div>
      </div>
    </Tooltip>
  );
}
