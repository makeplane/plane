/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TSectionStatus, TWorkloadMemberRow } from "@plane/types";
import { PanelSurface } from "./progress-panel";
import { ErrorPanel } from "./error-panel";
import type { TDashboardTabError } from "../error-handling";

interface Props {
  status: TSectionStatus;
  reason?: string;
  error: TDashboardTabError | null;
  isLoading: boolean;
  rows: TWorkloadMemberRow[];
  onRetry: () => void;
}

/**
 * 5-person preview slice of the workload panel. Sorts roster rows
 * overdue → blocked → started → open (descending) so the busiest
 * members surface first, mirroring the Overview §6.5 sort order.
 *
 * The parent (Overview tab) is responsible for fetching the workload
 * data via `buildScopePayload` + `dashboardOperationsService.workload`
 * — keeping the fetch out of this component lets tests render the
 * panel without spinning up the user/workspace hook tree.
 *
 * Surfaces honest state:
 * - `status: "ok"` renders the rows.
 * - `status: "unavailable"` from the server renders a typed
 *   unavailable state with the server-supplied reason and a retry
 *   button — no "metric pending backend" copy.
 * - HTTP / network / 5xx failures render the shared error panel
 *   with a retry button.
 */
export function WorkloadPreviewPanel({ status, reason, error, isLoading, rows, onRetry }: Props): React.ReactElement {
  const isPending = status === "unavailable";

  return (
    <PanelSurface
      title="Team workload"
      subtitle="Who is carrying the most open, overdue, and blocked work."
      isLoading={isLoading && !isPending && error === null}
      error={status === "error" && error !== null}
      testId="workload-preview-panel"
    >
      {status === "error" && error !== null ? (
        <ErrorPanel title="Failed to load workload" error={error} onRetry={onRetry} testId="workload-preview-error" />
      ) : isPending ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-3 text-12 text-secondary"
          data-testid="workload-preview-unavailable"
        >
          <p className="text-primary">Workload unavailable.</p>
          <p className="text-11 text-tertiary">
            {reason ? `Reason: ${reason}.` : "The server reported this section as unavailable."} Retry to fetch the
            latest.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="self-start rounded-sm border border-subtle bg-layer-2 px-3 py-1 text-12 text-secondary hover:bg-layer-3"
            data-testid="workload-preview-retry"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-12 text-tertiary">No workload in current scope.</div>
      ) : (
        <ul className="flex flex-col gap-1.5" data-testid="workload-preview-list">
          {rows.map((row) => (
            <li
              key={row.member_id || "unassigned-roster"}
              className="flex items-center gap-2 text-12"
              data-testid={`workload-preview-row-${row.member_id ?? "unassigned"}`}
            >
              <span className="flex-1 truncate text-primary" title={row.display_name}>
                {row.display_name}
              </span>
              {row.overdue > 0 ? (
                <span className="text-danger rounded-sm bg-danger-subtle px-1.5 text-11">{row.overdue} overdue</span>
              ) : null}
              {row.blocked > 0 ? (
                <span className="text-warning rounded-sm bg-warning-subtle px-1.5 text-11">{row.blocked} blocked</span>
              ) : null}
              <span className="font-mono text-tertiary tabular-nums">{row.open}</span>
            </li>
          ))}
        </ul>
      )}
    </PanelSurface>
  );
}
