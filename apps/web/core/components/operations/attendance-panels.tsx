/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * The attendance screen.
 *
 * Today's status and the two punches already live in the top navigation; this
 * is everything around them — history, leave, holidays and the working
 * schedule. Odoo remains the source of truth, so each panel says plainly when
 * the bridge cannot answer instead of showing a plausible zero.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// workspaces imports
import { cn } from "@workspaces/utils";
// services
import attendanceService, {
  type TAttendanceHistory,
  type TAttendanceHolidays,
  type TAttendanceLeave,
  type TAttendanceStatus,
  type TWorkingHours,
} from "@/services/attendance.service";
import { operationsService, type TTeamAvailability } from "@/services/operations";
// local imports
import {
  BridgeMissingPanel,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Pill,
  Section,
  StatTile,
  TileGrid,
  daysAgo,
  formatDate,
  formatHours,
  formatTime,
  toISODate,
} from "./common";
import { OperationsMember } from "./member";

const DAY_STATUS_CLASS: Record<string, string> = {
  present: "bg-success-primary/15 text-success-primary",
  absent: "bg-danger-primary/15 text-danger-primary",
  leave: "bg-accent-primary/10 text-accent-primary",
  holiday: "bg-layer-3 text-secondary",
  weekend: "bg-layer-3 text-placeholder",
};

const WEEKDAY_LABEL = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * A copy of `days` with the most recent first.
 *
 * `toReversed` would say this in one word, but the web app's tsconfig targets
 * ES2022 and does not have it — hence the copy-then-reverse.
 */
const newestFirst = <T,>(days: T[]): T[] => days.slice().reverse();

export const AttendanceToday = observer(function AttendanceToday() {
  const { data, error, isLoading } = useSWR<TAttendanceStatus>(
    "ATTENDANCE_STATUS",
    () => attendanceService.getStatus(),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (isLoading) return <LoadingPanel />;
  if (error) return <ErrorPanel label="Attendance is unavailable right now." />;
  if (!data?.available)
    return <BridgeMissingPanel what="Attendance" reason="Odoo is not configured for this deployment." />;

  return (
    <Section
      title="Today"
      description={
        data.employee
          ? `${data.employee.name}${data.employee.department ? ` · ${data.employee.department}` : ""}`
          : undefined
      }
    >
      <TileGrid className="xl:grid-cols-4">
        <StatTile
          label="Status"
          value={data.checked_in ? "Checked in" : "Not checked in"}
          tone={data.checked_in ? "positive" : "default"}
          hint={data.check_in ? `since ${formatTime(data.check_in)}` : undefined}
        />
        <StatTile label="Worked today" value={formatHours(data.worked_hours_today ?? 0)} />
        <StatTile label="Current session" value={formatHours(data.current_session_hours ?? 0)} />
        <StatTile label="Sessions" value={data.sessions_today?.length ?? 0} />
      </TileGrid>

      {(data.sessions_today?.length ?? 0) > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {data.sessions_today?.map((session, index) => (
            // oxlint-disable-next-line react/no-array-index-key
            <li key={index} className="flex items-center justify-between text-13 text-secondary">
              <span>
                {formatTime(session.check_in)} — {session.check_out ? formatTime(session.check_out) : "open"}
              </span>
              <span className="text-11 text-placeholder">{formatHours(session.worked_hours)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
});

export const AttendanceHistoryPanel = observer(function AttendanceHistoryPanel() {
  const [days, setDays] = useState(30);

  const { data, error, isLoading } = useSWR<TAttendanceHistory>(
    ["attendance-history", days],
    () => attendanceService.getHistory(daysAgo(days - 1), toISODate(new Date())),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return (
    <Section
      title="History"
      description="From Odoo"
      action={
        <div className="flex gap-1.5">
          {[7, 30, 90].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={cn(
                "rounded-full px-2.5 py-1 text-11 font-medium transition-colors",
                days === option ? "bg-accent-primary text-on-color" : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
              )}
            >
              {option}d
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel label="Attendance history is unavailable right now." />
      ) : !data?.available ? (
        <BridgeMissingPanel
          what="Attendance history"
          reason={data && data.available === false ? data.error : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TileGrid className="xl:grid-cols-5">
            <StatTile label="Worked" value={formatHours(data.totals.worked_hours)} />
            <StatTile label="Expected" value={formatHours(data.totals.expected_hours)} />
            <StatTile label="Present" value={data.totals.present_days} tone="positive" />
            <StatTile
              label="Absent"
              value={data.totals.absent_days}
              tone={data.totals.absent_days > 0 ? "warning" : "default"}
            />
            <StatTile label="Leave" value={data.totals.leave_days} />
          </TileGrid>

          {data.days.length === 0 ? (
            <EmptyPanel label="No attendance in this window" />
          ) : (
            <ul className="flex flex-col gap-1">
              {newestFirst(data.days).map((day) => (
                <li key={day.date} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="flex items-center gap-2">
                    <span className="w-28 text-13 text-secondary">{formatDate(day.date)}</span>
                    <Pill className={DAY_STATUS_CLASS[day.status]}>{day.status}</Pill>
                  </span>
                  <span className="text-11 text-placeholder">
                    {formatHours(day.worked_hours)} of {formatHours(day.expected_hours)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
});

export const LeavePanel = observer(function LeavePanel() {
  const { data, error, isLoading } = useSWR<TAttendanceLeave>("attendance-leave", () => attendanceService.getLeave(), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return (
    <Section title="Leave" description="Balances and requests, from Odoo">
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel label="Leave is unavailable right now." />
      ) : !data?.available ? (
        <BridgeMissingPanel what="Leave balance" reason={data && data.available === false ? data.error : undefined} />
      ) : (
        <div className="flex flex-col gap-4">
          {data.balances.length === 0 ? (
            <EmptyPanel label="No leave allocations" compact />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.balances.map((balance) => (
                <li key={balance.type} className="flex items-center justify-between gap-3">
                  <span className="text-13 text-secondary">{balance.type}</span>
                  <span className="text-13 text-primary">
                    <span className="font-medium tabular-nums">{balance.remaining}</span>
                    <span className="text-11 text-placeholder">
                      {" "}
                      of {balance.allocated} {balance.unit} left
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {data.requests.length > 0 && (
            <div>
              <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Requests</p>
              <ul className="flex flex-col gap-1.5">
                {data.requests.map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-3 text-13">
                    <span className="text-secondary">
                      {request.type} · {formatDate(request.start_date)} — {formatDate(request.end_date)}
                    </span>
                    <Pill>{request.state}</Pill>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  );
});

export const HolidayPanel = observer(function HolidayPanel() {
  const { data, error, isLoading } = useSWR<TAttendanceHolidays>(
    "attendance-holidays",
    () => attendanceService.getHolidays(),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return (
    <Section title="Holidays" description="The calendar that applies to you">
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel label="The holiday calendar is unavailable right now." />
      ) : !data?.available ? (
        <BridgeMissingPanel
          what="The holiday calendar"
          reason={data && data.available === false ? data.error : undefined}
        />
      ) : data.holidays.length === 0 ? (
        <EmptyPanel label="No holidays on the calendar" />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {data.holidays.map((holiday) => (
            <li key={`${holiday.date}-${holiday.name}`} className="flex items-center justify-between gap-3 text-13">
              <span className="text-secondary">{holiday.name}</span>
              <span className="text-11 text-placeholder">{formatDate(holiday.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
});

export const WorkingHoursPanel = observer(function WorkingHoursPanel() {
  const { data, error, isLoading } = useSWR<TWorkingHours>(
    "attendance-working-hours",
    () => attendanceService.getWorkingHours(),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return (
    <Section title="Working hours" description="Your contracted schedule">
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel label="Working hours are unavailable right now." />
      ) : !data?.available ? (
        <BridgeMissingPanel what="Working hours" reason={data && data.available === false ? data.error : undefined} />
      ) : (
        <div className="flex flex-col gap-4">
          <TileGrid className="grid-cols-1 sm:grid-cols-3 xl:grid-cols-3">
            <StatTile label="Per day" value={formatHours(data.hours_per_day)} />
            <StatTile label="Per week" value={formatHours(data.hours_per_week)} />
            <StatTile label="Calendar" value={data.calendar} />
          </TileGrid>
          <ul className="flex flex-col gap-1.5">
            {data.days.map((day) => (
              <li key={`${day.weekday}-${day.from}`} className="flex items-center justify-between gap-3 text-13">
                <span className="text-secondary">{WEEKDAY_LABEL[day.weekday] ?? `Day ${day.weekday}`}</span>
                <span className="text-11 text-placeholder">
                  {day.from} — {day.to}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
});

export const TeamAvailabilityPanel = observer(function TeamAvailabilityPanel({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const { data, error, isLoading } = useSWR<TTeamAvailability>(
    workspaceSlug ? ["operations-team-availability", workspaceSlug] : null,
    () => operationsService.getTeamAvailability(workspaceSlug),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return (
    <Section title="Who is in" description="Live from Odoo">
      {isLoading ? (
        <LoadingPanel />
      ) : error ? (
        <ErrorPanel label="Team availability is unavailable right now." />
      ) : !data?.available ? (
        <BridgeMissingPanel what="Team availability" reason={data?.reason} />
      ) : (
        <div className="flex flex-col gap-4">
          <TileGrid className="xl:grid-cols-4">
            <StatTile label="Checked in" value={data.checked_in} tone="positive" />
            <StatTile label="Not in" value={data.not_checked_in} />
            <StatTile label="Not linked" value={data.unlinked} tone={data.unlinked > 0 ? "warning" : "default"} />
            <StatTile label="Counted" value={data.counted} />
          </TileGrid>

          <ul className="flex flex-col gap-1.5">
            {data.members.map((member) => (
              <li key={member.member_id} className="flex items-center justify-between gap-3">
                <OperationsMember
                  memberId={member.member_id}
                  fallbackName={member.display_name}
                  fallbackAvatarUrl={member.avatar_url}
                />
                <span className="text-11 text-placeholder">
                  {!member.linked
                    ? "Not linked to an Odoo employee"
                    : member.checked_in
                      ? `In since ${formatTime(member.check_in)} · ${formatHours(member.worked_hours_today)}`
                      : "Not checked in"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
});
