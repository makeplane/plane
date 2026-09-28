/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCycleLaneRow, TTimelineDeadlineRow, TTimelineData } from "@plane/types";
import { PanelSurface } from "./progress-panel";
import { ErrorPanel } from "./error-panel";
import type { TDashboardTabError } from "../error-handling";

interface Props {
  isLoading: boolean;
  data: TTimelineData | null;
  error: TDashboardTabError | null;
  onRetry: () => void;
}

export function TimelinePreviewPanel({ isLoading, data, error, onRetry }: Props): React.ReactElement {
  const cycles = data?.cycle_lanes.rows.slice(0, 5) ?? [];
  const deadlines = data?.deadlines.rows.slice(0, 5) ?? [];

  return (
    <PanelSurface
      title="Cycles & deadlines"
      subtitle="Active project cycles and work due in the next week."
      isLoading={isLoading && error === null}
      error={error !== null}
      testId="timeline-preview-panel"
    >
      {error !== null ? (
        <ErrorPanel
          title="Failed to load cycles and deadlines"
          error={error}
          onRetry={onRetry}
          testId="timeline-preview-error"
        />
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section aria-label="Cycle preview">
            <h3 className="mb-1.5 text-12 font-medium text-secondary">Cycles · {data.cycle_lanes.total}</h3>
            <ul className="flex flex-col gap-1">
              {cycles.length === 0 ? (
                <li className="text-11 text-tertiary">No cycles in the current scope.</li>
              ) : (
                cycles.map((cycle: TCycleLaneRow) => (
                  <li key={cycle.cycle_id} className="flex items-center gap-2 text-12">
                    <span className="truncate text-primary">{cycle.cycle_name}</span>
                    <span className="text-11 text-tertiary">{cycle.project_name}</span>
                    {cycle.overdue_badge > 0 ? (
                      <span className="text-danger ml-auto text-11 tabular-nums">{cycle.overdue_badge} overdue</span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
          <section aria-label="Deadline preview">
            <h3 className="mb-1.5 text-12 font-medium text-secondary">Due soon · {data.deadlines.total}</h3>
            <ul className="flex flex-col gap-1">
              {deadlines.length === 0 ? (
                <li className="text-11 text-tertiary">No upcoming deadlines in scope.</li>
              ) : (
                deadlines.map((row: TTimelineDeadlineRow) => (
                  <li key={row.issue_id} className="flex items-center gap-2 text-12">
                    <span className="flex-1 truncate text-primary">{row.name}</span>
                    <span className="text-11 text-tertiary tabular-nums">{row.target_date}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </PanelSurface>
  );
}
