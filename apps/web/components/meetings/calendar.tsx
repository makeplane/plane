/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// plane imports
import type { TMeetingListItem, TWorkItemFilterExpression } from "@plane/types";
import { cn, generateWorkItemLink } from "@plane/utils";
// components
import { KindIcon } from "@/components/products/kind-icon";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTeam } from "@/hooks/store/use-team";
// services
import { MeetingService } from "@/services/meeting.service";
// local imports
import { localTime, meetingDays } from "./time";
import { useReaderTimezone } from "./use-reader-timezone";

const meetingService = new MeetingService();
const DAY = 86_400_000;

const MeetingsContext = createContext<Record<string, TMeetingListItem[]>>({});

/**
 * Whether the filters leave meetings in the calendar. Filters other than the kind are not applied
 * to meetings, so with any of them meetings are hidden rather than shown wrongly.
 */
export const areMeetingsShown = (filters: TWorkItemFilterExpression | undefined): boolean => {
  const conditions = Object.entries(filters ?? {}).flatMap(([key, value]) =>
    key === "and" && Array.isArray(value)
      ? value.flatMap((item) => Object.entries(item as Record<string, unknown>))
      : [[key, value] as [string, unknown]]
  );
  return conditions.every(
    ([key, value]) => ["kind__in", "kind__exact"].includes(key) && String(value).split(",").includes("meeting")
  );
};

type ProviderProps = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  /** First and last shown day, "YYYY-MM-DD". */
  startDate: string | undefined;
  endDate: string | undefined;
  isShown: boolean;
  children: ReactNode;
};

/** Loads the meetings of the shown period and groups them by the day of the reader. */
export const CalendarMeetingsProvider = observer(function CalendarMeetingsProvider(props: ProviderProps) {
  const { workspaceSlug, projectId, startDate, endDate, isShown, children } = props;
  const { isEnabled } = useTeam();
  const timeZone = useReaderTimezone();
  // a day more on each side covers every timezone
  const period =
    startDate && endDate
      ? {
          from: new Date(Date.parse(`${startDate}T00:00:00Z`) - DAY).toISOString(),
          to: new Date(Date.parse(`${endDate}T00:00:00Z`) + 2 * DAY).toISOString(),
        }
      : undefined;
  const { data } = useSWR(
    isEnabled && isShown && workspaceSlug && projectId && period
      ? ["MEETINGS", workspaceSlug, projectId, period.from, period.to]
      : null,
    () => meetingService.list(workspaceSlug ?? "", projectId ?? "", period ?? { from: "", to: "" })
  );

  const meetingsByDay = useMemo(() => {
    const days: Record<string, TMeetingListItem[]> = {};
    for (const meeting of data ?? [])
      for (const day of meetingDays(meeting, timeZone)) (days[day] ??= []).push(meeting);
    return days;
  }, [data, timeZone]);

  return <MeetingsContext.Provider value={meetingsByDay}>{children}</MeetingsContext.Provider>;
});

/** Meetings of one day, in the order of their start. */
export const CalendarDayMeetings = observer(function CalendarDayMeetings(props: {
  workspaceSlug: string | undefined;
  date: string;
}) {
  const { workspaceSlug, date } = props;
  const meetings = useContext(MeetingsContext)[date];
  const { getProjectIdentifierById } = useProject();
  const timeZone = useReaderTimezone();

  if (!meetings?.length) return null;

  return (
    <ul className="space-y-1 px-2 py-1">
      {meetings.map((meeting) => (
        <li key={meeting.id}>
          <Link
            href={generateWorkItemLink({
              workspaceSlug,
              projectId: meeting.project_id,
              issueId: meeting.id,
              projectIdentifier: getProjectIdentifierById(meeting.project_id),
              sequenceId: meeting.sequence_id,
            })}
            className={cn(
              "flex items-center gap-1.5 rounded-sm border border-subtle bg-layer-2 px-1.5 py-1 text-caption-md-regular text-primary hover:bg-layer-2-hover",
              { "text-tertiary line-through": meeting.state_group === "cancelled" }
            )}
          >
            <KindIcon kind="meeting" />
            <span className="shrink-0 text-tertiary">
              {localTime(meeting.start_at, timeZone)}–{localTime(meeting.end_at, timeZone)}
            </span>
            <span className="truncate">{meeting.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
});
