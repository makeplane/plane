/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Badge } from "@makeplane/propel/components/badge";
import { formatHm } from "@plane/services";
import type { TTeamStatusRow } from "@plane/types";

const STATE: Record<TTeamStatusRow["state"], { label: string; variant: "success" | "warning" | "danger" | "neutral" }> =
  {
    RUNNING: { label: "Working", variant: "success" },
    BREAK: { label: "On a break", variant: "warning" },
    FROZEN: { label: "Frozen", variant: "danger" },
    DONE: { label: "Finished work", variant: "neutral" },
    IDLE: { label: "Not working", variant: "neutral" },
  };

const MODE: Record<string, string> = { REMOTE: "Remote", ONSITE: "Onsite", HYBRID: "Hybrid" };

/** Who is doing what right now, for the people the viewer manages. */
export function TeamNow({ rows }: { rows: TTeamStatusRow[] }) {
  return (
    <section aria-label="Team now" className="flex flex-col gap-2">
      <h3 className="text-body-md-medium text-primary">Team now</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.user.id} className="flex flex-col gap-1 rounded-lg border border-subtle bg-surface-1 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-body-sm-medium text-primary">{row.user.display_name}</span>
              <Badge variant={STATE[row.state].variant} size="sm" label={STATE[row.state].label} />
            </div>
            <p className="truncate text-body-xs-regular text-secondary">
              {row.work_item ? `${row.work_item} ${row.work_item_name ?? ""}` : "—"}
            </p>
            <p className="text-caption-sm-regular text-tertiary">
              {row.mode ? MODE[row.mode] : "Has not said how they work"} · {formatHm(row.worked_today_seconds)} today
              {row.frozen_today_seconds > 0 ? ` · ${formatHm(row.frozen_today_seconds)} frozen` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
