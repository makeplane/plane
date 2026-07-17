import type { SgTagRow } from "../../types";
import type { TimelineRowPlacement } from "../utils/timeline-model";
import { formatTimelineTickLabel } from "../utils/timeline-scale";

export const formatTooltipText = (value: string, transform: "title" | "upper") => {
  const normalizedValue = value.trim().replace(/[_-]+/g, " ");
  if (!normalizedValue || normalizedValue === "--") return "";

  if (transform === "upper") return normalizedValue.toUpperCase();

  return normalizedValue
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const TimelineTagTooltip = ({ placement, row }: { placement: TimelineRowPlacement; row: SgTagRow }) => {
  const startLabel = formatTimelineTickLabel(placement.startSeconds);
  const endLabel =
    placement.endSeconds !== null && placement.endSeconds > placement.startSeconds
      ? formatTimelineTickLabel(placement.endSeconds)
      : "";
  const timeLabel = endLabel ? `${startLabel}-${endLabel}` : startLabel;
  const actionLabel = formatTooltipText(row.action, "upper");
  const resultLabel = formatTooltipText(row.result, "title");
  const detailLabel = [actionLabel, resultLabel].filter(Boolean).join(" - ") || formatTooltipText(row.player, "title");

  return (
    <div className="min-w-[92px] leading-tight">
      <div className="text-[9px] font-medium text-[#3b6f50]">{timeLabel}</div>
      <div className="mt-0.5 whitespace-nowrap text-[10px] font-semibold text-[#123f24]">{detailLabel || "Tag"}</div>
    </div>
  );
};
