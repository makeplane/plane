"use client";

import { SignalHigh } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// types
import { PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssuePriorities } from "@plane/types";
// constants
import { cn, getIssuePriorityFilters } from "@plane/utils";

export const IssueBlockPriority = ({
  priority,
  shouldShowName = false,
}: {
  priority: TIssuePriorities | null;
  shouldShowName?: boolean;
}) => {
  // hooks
  const { t } = useTranslation();
  const priority_detail = priority != null ? getIssuePriorityFilters(priority) : null;

  const priorityClasses = {
    urgent: "bg-red-600/10 text-red-600 border-red-600 px-1",
    high: "bg-orange-500/20 text-orange-950 border-orange-500",
    medium: "bg-yellow-500/20 text-yellow-950 border-yellow-500",
    low: "bg-custom-primary-100/20 text-custom-primary-950 border-custom-primary-100",
    none: "hover:bg-custom-background-80 border-custom-border-300",
  };

  if (priority_detail === null) return <></>;

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={t(priority_detail?.titleTranslationKey || "")}>
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] rounded text-xs px-2 py-0.5",
          priorityClasses[priority ?? "none"],
          {
            // compact the icons if text is hidden
            "px-0.5": !shouldShowName,
            // highlight the whole button if text is hidden and priority is urgent
            "bg-red-600/10 border-red-600": priority === "urgent" && shouldShowName,
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
        {shouldShowName && <span className="pl-2 text-sm">{t(priority_detail?.titleTranslationKey || "")}</span>}
      </div>
    </Tooltip>
  );
};
