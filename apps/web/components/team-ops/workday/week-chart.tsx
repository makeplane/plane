/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { SelectField } from "@makeplane/propel/components/select-field";
import { formatHm, weeklyChart } from "@plane/services";
import type { TWorkSession } from "@plane/types";

type Props = { weekStart: string; sessions: TWorkSession[] };

const PLACES = [
  { value: "", label: "Onsite and remote" },
  { value: "ONSITE", label: "Onsite only" },
  { value: "REMOTE", label: "Remote only" },
];

const HOURS = Array.from({ length: 25 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")}:00`,
}));

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const parse = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Hours worked on each day of the week, Saturday to Friday, filtered by place and by the hours of the day. */
export function WeekChart({ weekStart, sessions }: Props) {
  const [place, setPlace] = useState<"" | "ONSITE" | "REMOTE">("");
  const [fromHour, setFromHour] = useState(0);
  const [toHour, setToHour] = useState(24);

  const days = useMemo(
    () => weeklyChart(sessions, weekStart, { place, fromHour, toHour: Math.max(toHour, fromHour + 1) }),
    [sessions, weekStart, place, fromHour, toHour]
  );
  const total = days.reduce((sum, day) => sum + day.seconds, 0);
  // At least four hours of height, so a quiet week does not look full.
  const top = Math.max(4 * 3600, ...days.map((day) => day.seconds));

  return (
    <section aria-label="Weekly work" className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-body-md-medium text-primary">This week by day</h3>
          <p className="text-caption-sm-regular text-tertiary">
            {formatHm(total)} in total
            {fromHour !== 0 || toHour !== 24
              ? ` between ${String(fromHour).padStart(2, "0")}:00 and ${String(toHour).padStart(2, "0")}:00`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-44 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="Place"
              options={PLACES}
              value={place}
              onValueChange={(value) => setPlace((value ?? "") as "" | "ONSITE" | "REMOTE")}
            />
          </div>
          <div className="w-28 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="From"
              options={HOURS.slice(0, 24)}
              value={String(fromHour)}
              onValueChange={(value) => setFromHour(Number(value ?? 0))}
            />
          </div>
          <div className="w-28 [&_button]:min-w-0">
            <SelectField
              size="lg"
              label="To"
              options={HOURS.slice(1)}
              value={String(toHour)}
              onValueChange={(value) => setToHour(Number(value ?? 24))}
            />
          </div>
          <button
            type="button"
            className="self-end pb-2 text-body-xs-medium text-accent-primary hover:underline"
            onClick={() => {
              setFromHour(9);
              setToHour(18);
            }}
          >
            Working hours 09–18
          </button>
        </div>
      </header>
      <ol className="flex h-40 items-end gap-2">
        {days.map((day) => (
          <li key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-caption-sm-medium text-secondary tabular-nums">
              {day.seconds > 0 ? formatHm(day.seconds) : ""}
            </span>
            <div
              role="img"
              aria-label={`${weekday.format(parse(day.date))}: ${formatHm(day.seconds)}`}
              className="w-full max-w-12 rounded-t-md"
              style={{
                height: `${Math.max(day.seconds > 0 ? 4 : 2, Math.round((day.seconds / top) * 100))}%`,
                backgroundColor:
                  day.seconds > 0 ? "var(--background-color-accent-primary)" : "var(--background-color-layer-1)",
              }}
            />
            <span className="text-caption-sm-regular text-tertiary">{weekday.format(parse(day.date))}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
