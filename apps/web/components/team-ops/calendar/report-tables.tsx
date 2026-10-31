/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CALENDAR_KINDS, formatDuration, parseDateKey } from "@plane/services";
import type { TCalendarKind, TComparisonFlag, TPlanSummaryReport, TPlannedVsLoggedReport } from "@plane/types";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { DAY_KIND_META, DayKindBadge, DayKindDot } from "./work-mode";

const hoursOrDash = (seconds: number) => (seconds > 0 ? formatDuration(seconds, "en-US") : "–");
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" });

const HEAD = "px-3 py-2 font-medium";
const CELL = "px-3 py-2 tabular-nums";

const PersonCell = observer(function PersonCell({ userId }: { userId: string }) {
  const { getUserDetails } = useMember();
  return (
    <span className="flex items-center gap-2">
      <ButtonAvatars showTooltip={false} userIds={userId} size="xs" />
      <span className="truncate">{getUserDetails(userId)?.display_name ?? "Unknown"}</span>
    </span>
  );
});

type SummaryProps = { report: TPlanSummaryReport };

/** One row per person: days in each category and planned hours, then a total. */
export function PlanSummaryTable({ report }: SummaryProps) {
  if (report.people.length === 0) {
    return <p className="text-body-sm-regular text-tertiary">There is nobody to report on for these filters.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-subtle bg-surface-1">
      <table className="w-full min-w-176 text-left">
        <thead className="border-b border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
          <tr>
            <th scope="col" className={HEAD}>
              Person
            </th>
            {CALENDAR_KINDS.map((kind) => (
              <th key={kind} scope="col" className={HEAD}>
                <span className="flex items-center gap-1.5">
                  <DayKindDot kind={kind} />
                  {DAY_KIND_META[kind].label}
                </span>
              </th>
            ))}
            <th scope="col" className={HEAD}>
              Planned hours
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle text-body-sm-regular text-primary">
          {report.people.map((row) => (
            <tr key={row.user}>
              <td className="px-3 py-2">
                <PersonCell userId={row.user} />
              </td>
              {CALENDAR_KINDS.map((kind: TCalendarKind) => (
                <td key={kind} className={CELL}>
                  {row.counts[kind] || <span className="text-tertiary">0</span>}
                </td>
              ))}
              <td className={CELL}>{hoursOrDash(row.planned_seconds)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-subtle bg-layer-1 text-body-sm-medium text-primary">
          <tr>
            <th scope="row" className="px-3 py-2 text-left">
              Total
            </th>
            {CALENDAR_KINDS.map((kind) => (
              <td key={kind} className={CELL}>
                {report.totals.counts[kind]}
              </td>
            ))}
            <td className={CELL}>{hoursOrDash(report.totals.planned_seconds)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const FLAG_COLUMNS: TComparisonFlag[] = ["PLANNED_NOTHING_LOGGED", "LOGGED_ON_DAY_OFF", "LOGGED_NOT_PLANNED"];

type ComparisonProps = { report: TPlannedVsLoggedReport };

const signed = (seconds: number) =>
  seconds === 0 ? "–" : `${seconds > 0 ? "+" : "−"}${formatDuration(Math.abs(seconds), "en-US")}`;

/** One row per person with planned and logged hours; open a row to see the days behind it. */
export function ComparisonTable({ report }: ComparisonProps) {
  if (report.people.length === 0) {
    return <p className="text-body-sm-regular text-tertiary">There is nobody to report on for these filters.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-subtle bg-surface-1">
        <table className="w-full min-w-176 text-left">
          <thead className="border-b border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
            <tr>
              <th scope="col" className={HEAD}>
                Person
              </th>
              <th scope="col" className={HEAD}>
                Planned
              </th>
              <th scope="col" className={HEAD}>
                Logged
              </th>
              <th scope="col" className={HEAD}>
                Difference
              </th>
              {FLAG_COLUMNS.map((flag) => (
                <th key={flag} scope="col" className={HEAD} title={report.flag_labels[flag]}>
                  {report.flag_labels[flag]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle text-body-sm-regular text-primary">
            {report.people.map((row) => (
              <tr key={row.user}>
                <td className="px-3 py-2">
                  <PersonCell userId={row.user} />
                </td>
                <td className={CELL}>{hoursOrDash(row.planned_seconds)}</td>
                <td className={CELL}>{hoursOrDash(row.logged_seconds)}</td>
                <td className={CELL}>{signed(row.difference_seconds)}</td>
                {FLAG_COLUMNS.map((flag) => (
                  <td key={flag} className={CELL}>
                    {row.flags[flag] || <span className="text-tertiary">0</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-subtle bg-layer-1 text-body-sm-medium text-primary">
            <tr>
              <th scope="row" className="px-3 py-2 text-left">
                Total
              </th>
              <td className={CELL}>{hoursOrDash(report.totals.planned_seconds)}</td>
              <td className={CELL}>{hoursOrDash(report.totals.logged_seconds)}</td>
              <td className={CELL}>{signed(report.totals.logged_seconds - report.totals.planned_seconds)}</td>
              {FLAG_COLUMNS.map((flag) => (
                <td key={flag} className={CELL}>
                  {report.totals.flags[flag]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {report.people.some((row) => row.days.length > 0) ? (
        <h3 className="mt-2 text-body-sm-medium text-primary">Days</h3>
      ) : null}
      {report.people
        .filter((row) => row.days.length > 0)
        .map((row) => (
          <details key={row.user} className="rounded-lg border border-subtle bg-surface-1">
            <summary className="cursor-pointer px-3 py-2 text-body-sm-medium text-primary">
              <PersonCell userId={row.user} />
            </summary>
            <table className="w-full text-left">
              <thead className="border-y border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
                <tr>
                  <th scope="col" className={HEAD}>
                    Day
                  </th>
                  <th scope="col" className={HEAD}>
                    Plan
                  </th>
                  <th scope="col" className={HEAD}>
                    Planned
                  </th>
                  <th scope="col" className={HEAD}>
                    Logged
                  </th>
                  <th scope="col" className={HEAD}>
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-body-sm-regular text-primary">
                {row.days.map((day) => (
                  <tr key={day.date}>
                    <td className="px-3 py-2">{dayFormat.format(parseDateKey(day.date))}</td>
                    <td className="px-3 py-2">{day.kind ? <DayKindBadge kind={day.kind} /> : "–"}</td>
                    <td className={CELL}>{hoursOrDash(day.planned_seconds)}</td>
                    <td className={CELL}>{hoursOrDash(day.logged_seconds)}</td>
                    <td className="px-3 py-2 text-secondary">{day.flag ? report.flag_labels[day.flag] : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
    </div>
  );
}
