/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CalendarOutline, DueDateOutline, StartDateOutline } from "@makeplane/propel/icons";
// plane imports
import type { TStateGroups } from "@plane/types";
import { cn, getIssueDueDateClassName, renderFormattedDate } from "@plane/utils";

type Props = {
  startDate: string | null;
  stateGroup: TStateGroups;
  targetDate: string | null;
};

export function WorkItemPreviewCardDate(props: Props) {
  const { startDate, stateGroup, targetDate } = props;
  // derived values
  const isDateRangeEnabled = Boolean(startDate && targetDate);
  const dueDateClassName = getIssueDueDateClassName(targetDate, stateGroup);

  if (!startDate && !targetDate) return null;

  return (
    <div className="h-full rounded-sm px-1 text-caption-sm-regular text-secondary">
      {isDateRangeEnabled ? (
        <div className={cn("flex h-full items-center gap-1", dueDateClassName)}>
          <CalendarOutline className="size-3 shrink-0" />
          <span>
            {renderFormattedDate(startDate)} - {renderFormattedDate(targetDate)}
          </span>
        </div>
      ) : startDate ? (
        <div className="flex h-full items-center gap-1">
          <StartDateOutline className="size-3 shrink-0" />
          <span>{renderFormattedDate(startDate)}</span>
        </div>
      ) : (
        <div className={cn("flex h-full items-center gap-1", dueDateClassName)}>
          <DueDateOutline className="size-3 shrink-0" />
          <span>{renderFormattedDate(targetDate)}</span>
        </div>
      )}
    </div>
  );
}
