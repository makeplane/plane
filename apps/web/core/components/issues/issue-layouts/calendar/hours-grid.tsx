/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { parseISO } from "date-fns";
import { observer } from "mobx-react";
import type { TIssue, TIssueMap } from "@plane/types";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
import { highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlockRoot } from "./issue-block-root";

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 18;

type Props = {
  issues: TIssueMap | undefined;
  quickActions: TRenderQuickActions;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
};

const CalendarHourRow = observer(function CalendarHourRow(props: {
  dateString: string;
  hour: number;
  issues: TIssue[];
  quickActions: TRenderQuickActions;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
}) {
  const { dateString, hour, issues, quickActions, readOnly, canEditProperties, isEpic, showDueDateBadge } = props;
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ date: dateString, hour }),
        onDragEnter: () => setIsDraggingOver(true),
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: ({ source }) => {
          setIsDraggingOver(false);
          highlightIssueOnDrop(source?.element?.id, false);
        },
      })
    );
  }, [dateString, hour]);

  return (
    <div className="grid grid-cols-[56px_1fr] border-b border-subtle-1">
      <div className="px-2 py-3 text-11 text-tertiary">{`${hour.toString().padStart(2, "0")}:00`}</div>
      <div
        ref={rowRef}
        className={cn("min-h-14 px-2 py-1", {
          "bg-layer-transparent-hover opacity-80": isDraggingOver,
        })}
      >
        <div className="flex flex-col gap-1">
          {issues.map((issue) => (
            <CalendarIssueBlockRoot
              key={issue.id}
              issueId={issue.id}
              quickActions={quickActions}
              isDragDisabled={readOnly ?? false}
              sourceDate={dateString}
              isEpic={isEpic}
              canEditProperties={canEditProperties}
              showDueDateBadge={showDueDateBadge}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export const CalendarHoursGrid = observer(function CalendarHoursGrid(props: Props) {
  const { issues, quickActions, readOnly, canEditProperties, isEpic, showDueDateBadge } = props;
  const issueCalendarView = useCalendarView();
  const activeHoursDate = issueCalendarView.calendarFilters.activeHoursDate;
  const dateString = renderFormattedPayloadDate(activeHoursDate);

  const issuesByHour = useMemo(() => {
    const grouped: Record<number, TIssue[]> = {};
    if (!issues || !dateString) return grouped;

    Object.values(issues).forEach((issue) => {
      if (!issue?.planned_at) return;
      if (issue.planned_at.slice(0, 10) !== dateString) return;
      const hour = parseISO(issue.planned_at).getHours();
      grouped[hour] = grouped[hour] ? [...grouped[hour], issue] : [issue];
    });

    return grouped;
  }, [issues, dateString]);

  if (!dateString) return null;

  const hours = Array.from(
    { length: WORKDAY_END_HOUR - WORKDAY_START_HOUR + 1 },
    (_, index) => WORKDAY_START_HOUR + index
  );

  return (
    <div className="w-full border-t border-subtle-1">
      {hours.map((hour) => (
        <CalendarHourRow
          key={hour}
          dateString={dateString}
          hour={hour}
          issues={issuesByHour[hour] ?? []}
          quickActions={quickActions}
          readOnly={readOnly}
          canEditProperties={canEditProperties}
          isEpic={isEpic}
          showDueDateBadge={showDueDateBadge}
        />
      ))}
    </div>
  );
});
