/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { formatDuration } from "@plane/services";
import type { TWorkTasks } from "@plane/types";

type Props = { title: string; tasks: TWorkTasks | undefined };

/** Time per work item as horizontal bars: the longest task fills the row, the rest scale to it. */
export function TimeByTask({ title, tasks }: Props) {
  const rows = tasks?.results ?? [];
  const longest = Math.max(1, ...rows.map((row) => row.seconds));

  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-body-md-medium text-primary">{title}</h3>
        <span className="text-body-sm-medium text-secondary tabular-nums">
          {formatDuration(tasks?.total_seconds ?? 0, "en-US")}
        </span>
      </header>
      {rows.length === 0 ? (
        <p className="text-body-sm-regular text-tertiary">No time logged yet. Pick a task and start the timer.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.issue} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-body-sm-regular">
                <span className="min-w-0 truncate text-primary">
                  <span className="text-tertiary">{row.key}</span> {row.name}
                </span>
                <span className="shrink-0 font-medium text-secondary tabular-nums">
                  {formatDuration(row.seconds, "en-US")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-layer-1" aria-hidden>
                <div
                  className="h-full rounded-full bg-accent-primary"
                  style={{ width: `${Math.max(3, Math.round((row.seconds / longest) * 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
