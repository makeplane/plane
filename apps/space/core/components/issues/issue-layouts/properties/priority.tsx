/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { SignalHigh } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// types
import { PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssuePriorities } from "@plane/types";
// constants
import { cn, getIssuePriorityFilters } from "@plane/utils";

const PRIORITY_BORDERS: Record<TIssuePriorities, string> = {
  urgent: "border-priority-urgent",
  high: "border-priority-high",
  medium: "border-priority-medium",
  low: "border-priority-low",
  none: "border-priority-none",
};

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

  if (priority_detail === null) return <></>;

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={t(priority_detail?.titleTranslationKey || "")} className="w-fit">
      <div className="flex items-center gap-1.5 text-caption-sm-regular w-fit">
        {priority ? (
          <span
            className={cn("inline-flex shrink-0 items-center justify-center", {
              "border-[0.5px] rounded-sm p-0.5": !shouldShowName || priority === "urgent",
              [PRIORITY_BORDERS[priority]]: !shouldShowName || priority === "urgent",
            })}
          >
            <PriorityIcon
              priority={priority}
              size={12}
              className={cn({
                "h-3.5 w-3.5": !shouldShowName,
                "translate-x-[0.0625rem]": !shouldShowName && priority === "high",
                "translate-x-0.5": !shouldShowName && priority === "medium",
                "translate-x-1": !shouldShowName && priority === "low",
              })}
            />
          </span>
        ) : (
          <SignalHigh className="size-3" />
        )}
        {shouldShowName && (
          <span className="text-caption-sm-regular">{t(priority_detail?.titleTranslationKey || "")}</span>
        )}
      </div>
    </Tooltip>
  );
}
