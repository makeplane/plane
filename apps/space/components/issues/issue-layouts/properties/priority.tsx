/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { SignalHigh } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// types
import { PriorityIcon } from "@plane/blocks/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
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
    <Tooltip label={`Priority: ${t(priority_detail?.titleTranslationKey || "")}`}>
      <div
        className={cn(
          "flex h-full items-center gap-1.5 rounded-sm border-[0.5px] px-2 py-0.5 text-11",
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
            // increase the icon size if text is hidden
            className={cn("size-3", { "size-3.5": !shouldShowName })}
          />
        ) : (
          <SignalHigh className="size-3" />
        )}
        {shouldShowName && <span className="pl-2 text-13">{t(priority_detail?.titleTranslationKey || "")}</span>}
      </div>
    </Tooltip>
  );
}
