/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import useSWR from "swr";
import { WorkdayService, buildHeatGrid, formatHm } from "@plane/services";
import type { THeatMetric } from "@plane/services";
import { cn } from "@plane/utils";

const workdayService = new WorkdayService();

type Props = { workspaceSlug: string; userId?: string };

// Steps of blue, mixed with the page's own surface so they read in light and dark themes.
const LEVEL_COLOR = [
  "var(--background-color-layer-1)",
  "color-mix(in oklab, var(--background-color-accent-primary) 28%, var(--background-color-layer-1))",
  "color-mix(in oklab, var(--background-color-accent-primary) 52%, var(--background-color-layer-1))",
  "color-mix(in oklab, var(--background-color-accent-primary) 76%, var(--background-color-layer-1))",
  "var(--background-color-accent-primary)",
];

const ROW_LABELS = ["Sat", "", "Mon", "", "Wed", "", "Fri"];
const month = new Intl.DateTimeFormat("en-US", { month: "short" });
const full = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const parse = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** A year of work, one square per day, like a contribution graph: darker blue means more tasks (or hours). */
export function ContributionGraph({ workspaceSlug, userId }: Props) {
  const [metric, setMetric] = useState<THeatMetric>("tasks");
  const { data } = useSWR(`TEAM_OPS_HEATMAP_${workspaceSlug}_${userId ?? "me"}`, () =>
    workdayService.getHeatmap(workspaceSlug, userId)
  );
  const grid = useMemo(() => (data ? buildHeatGrid(data.from, data.to, data.days, metric) : []), [data, metric]);

  const totalTasks = (data?.days ?? []).reduce((sum, day) => sum + day.tasks, 0);
  const totalSeconds = (data?.days ?? []).reduce((sum, day) => sum + day.seconds, 0);
  const activeDays = (data?.days ?? []).length;

  // A month name goes above the first column that starts in that month.
  const monthLabels = grid.map((week, index) => {
    const firstDay = week.find((cell) => cell !== null);
    if (!firstDay) return "";
    const date = parse(firstDay.date);
    const previous = index > 0 ? grid[index - 1].find((cell) => cell !== null) : null;
    return !previous || parse(previous.date).getMonth() !== date.getMonth() ? month.format(date) : "";
  });

  return (
    <section
      aria-label="Work in the last year"
      className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-body-md-medium text-primary">
            {metric === "tasks" ? `${totalTasks} task days` : `${formatHm(totalSeconds)} worked`} in the last year
          </h3>
          <p className="text-caption-sm-regular text-tertiary">
            {activeDays} days with finished work · weeks run Saturday to Friday
          </p>
        </div>
        <div role="group" aria-label="Measure" className="flex gap-1 rounded-lg border border-subtle p-0.5">
          {(["tasks", "hours"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={metric === item}
              onClick={() => setMetric(item)}
              className={cn(
                "rounded-md px-3 py-1 text-body-xs-medium",
                metric === item ? "bg-accent-subtle text-accent-primary" : "text-tertiary hover:text-secondary"
              )}
            >
              {item === "tasks" ? "Tasks" : "Hours"}
            </button>
          ))}
        </div>
      </header>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          <div className="flex flex-col gap-[3px] pt-[18px]">
            {ROW_LABELS.map((label, index) => (
              <span key={index} className="h-[11px] text-[10px] leading-[11px] text-tertiary">
                {label}
              </span>
            ))}
          </div>
          <div>
            <div className="flex gap-[3px]">
              {monthLabels.map((label, index) => (
                <span
                  key={index}
                  className="h-[15px] w-[11px] overflow-visible text-[10px] whitespace-nowrap text-tertiary"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-[3px] flex gap-[3px]">
              {grid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((cell, rowIndex) =>
                    cell ? (
                      <div
                        key={cell.date}
                        className="size-[11px] rounded-[2px]"
                        style={{ backgroundColor: LEVEL_COLOR[cell.level] }}
                        title={`${
                          cell.tasks === 0
                            ? "No work"
                            : `${cell.tasks} task${cell.tasks === 1 ? "" : "s"} · ${formatHm(cell.seconds)}`
                        } on ${full.format(parse(cell.date))}`}
                      />
                    ) : (
                      <div key={`empty-${rowIndex}`} className="size-[11px]" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-1 text-caption-sm-regular text-tertiary">
        Less
        {LEVEL_COLOR.map((color, index) => (
          <span key={index} className="size-[11px] rounded-[2px]" style={{ backgroundColor: color }} />
        ))}
        More
      </footer>
    </section>
  );
}
