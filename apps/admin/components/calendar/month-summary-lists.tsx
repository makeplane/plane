/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import type { IDayOverride, IHoliday } from "@plane/types";
import { cn } from "@plane/utils";
import type { MonthStats } from "./calendar-stats-helper";

const OVERRIDE_LABEL: Record<IDayOverride["type"], string> = {
  WORKDAY: "Make-up workday",
  HOLIDAY: "Make-up day off",
};

type StatsProps = { monthLabel: string; stats: MonthStats; overrideCount: number };

export const MonthSummaryCard = ({ monthLabel, stats, overrideCount }: StatsProps) => (
  <div className="bg-surface-1 border border-subtle rounded-lg p-4">
    <p className="text-body-sm-semibold text-primary mb-3">{monthLabel} summary</p>
    <div className="grid grid-cols-4 gap-4">
      <Stat label="Working" value={stats.workingDays} />
      <Stat label="Holidays" value={stats.holidayCount} />
      <Stat label="Weekends" value={stats.weekendCount} />
      <Stat label="Overrides" value={overrideCount} />
    </div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="text-h4-semibold text-primary">{value}</div>
    <div className="text-caption-sm-regular text-secondary">{label}</div>
  </div>
);

type ListProps = {
  monthLabel: string;
  holidays: IHoliday[];
  overrides: IDayOverride[];
};

export const MonthLists = ({ monthLabel, holidays, overrides }: ListProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Panel title={`Holidays in ${monthLabel}`} empty="No holidays this month.">
      {holidays.map((h) => (
        <li key={h.id} className="flex justify-between gap-3">
          <DateBadge iso={h.date} />
          <span className="text-primary truncate flex-1">{h.name}</span>
        </li>
      ))}
    </Panel>
    <Panel title={`Overrides in ${monthLabel}`} empty="No overrides this month.">
      {overrides.map((o) => (
        <li key={o.id} className="flex justify-between gap-3">
          <DateBadge iso={o.date} />
          <span className="text-primary truncate flex-1">{o.reason || OVERRIDE_LABEL[o.type]}</span>
          <span
            className={cn(
              "px-1.5 rounded text-caption-sm-medium shrink-0",
              o.type === "WORKDAY" ? "bg-warning-subtle text-warning-primary" : "bg-success-subtle text-success-primary"
            )}
          >
            {o.type === "WORKDAY" ? "Workday" : "Day off"}
          </span>
        </li>
      ))}
    </Panel>
  </div>
);

const DateBadge = ({ iso }: { iso: string }) => (
  <span className="text-tertiary tabular-nums shrink-0">
    {iso.slice(8)}/{iso.slice(5, 7)}
  </span>
);

const Panel = ({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) => {
  const hasItems = Array.isArray(children) && children.length > 0;
  return (
    <div className="bg-surface-1 border border-subtle rounded-lg p-4">
      <p className="text-body-sm-semibold text-primary mb-3">{title}</p>
      {hasItems ? (
        <ul className="space-y-1.5 text-caption-sm-regular max-h-60 overflow-y-auto">{children}</ul>
      ) : (
        <p className="text-caption-sm-regular text-tertiary">{empty}</p>
      )}
    </div>
  );
};
