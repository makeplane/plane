import { SignalHigh } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// types
import { PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssuePriorities } from "@plane/types";
// constants
import { cn, getIssuePriorityFilters } from "@plane/utils";

export function IssueBlockPriority({
  priority,
  shouldShowName = false,
}: {
  priority: TIssuePriorities | null;
  shouldShowName?: boolean;
}) {
  // hooks
  const { t } = useTranslation();
  const priority_detail = priority != null ? getIssuePriorityFilters(priority) : null;

  const priorityClasses = {
    urgent: "bg-layer-2 text-priority-urgent border-priority-urgent px-1",
    high: "bg-layer-2 text-priority-high border-priority-high",
    medium: "bg-layer-2 text-priority-medium border-priority-medium",
    low: "bg-layer-2 text-priority-low border-priority-low",
    none: "bg-layer-2 text-priority-none border-priority-none",
  };

  if (priority_detail === null) return <></>;

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={t(priority_detail?.titleTranslationKey || "")}>
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] rounded-sm text-11 px-2 py-0.5",
          priorityClasses[priority ?? "none"],
          {
            // compact the icons if text is hidden
            "px-0.5": !shouldShowName,
            // highlight the whole button if text is hidden and priority is urgent
            "border-priority-urgent": priority === "urgent" && shouldShowName,
          }
        )}
      >
        {priority ? (
          <PriorityIcon
            priority={priority}
            size={12}
            className={cn("flex-shrink-0", {
              // increase the icon size if text is hidden
              "h-3.5 w-3.5": !shouldShowName,
              // centre align the icons if text is hidden
              "translate-x-[0.0625rem]": !shouldShowName && priority === "high",
              "translate-x-0.5": !shouldShowName && priority === "medium",
              "translate-x-1": !shouldShowName && priority === "low",
              // highlight the icon if priority is urgent
            })}
          />
        ) : (
          <SignalHigh className="size-3" />
        )}
        {shouldShowName && <span className="pl-2 text-13">{t(priority_detail?.titleTranslationKey || "")}</span>}
      </div>
    </Tooltip>
  );
}
