/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TSectionStatus, TWorkloadMemberRow } from "@plane/types";
import { OverviewDeepLink } from "../overview-deep-link";
import { PanelSurface } from "./progress-panel";
import { ScopeTimeBadge } from "./scope-time-badge";
import { WorkloadAllocationBar } from "./workload-allocation-bar";
import { ErrorPanel } from "./error-panel";
import type { TDashboardTabError } from "../error-handling";

interface Props {
  status: TSectionStatus;
  reason?: string;
  error: TDashboardTabError | null;
  isLoading: boolean;
  rows: TWorkloadMemberRow[];
  totalMembers?: number;
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
export function WorkloadPreviewPanel({
  status,
  reason,
  error,
  isLoading,
  rows,
  totalMembers,
  onRetry,
}: Props): React.ReactElement {
  const isPending = status === "unavailable";

  return (
    <PanelSurface
      title="Ai đang nhiều việc"
      subtitle="Sắp xếp theo mức độ cần xử lý — thanh nhỏ = % việc theo dự án/nhãn trong kỳ đã chọn."
      isLoading={isLoading && !isPending && error === null}
      error={status === "error" && error !== null}
      testId="workload-preview-panel"
      headerExtra={<ScopeTimeBadge kind="snapshot" />}
      footer={
        rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-2 text-11 text-tertiary">
            <span>
              {rows.length}
              {totalMembers !== undefined ? ` / ${totalMembers}` : ""} thành viên (xem trước)
            </span>
            <OverviewDeepLink tab="workload">Xem toàn bộ khối lượng →</OverviewDeepLink>
          </div>
        ) : null
      }
    >
      {status === "error" && error !== null ? (
        <ErrorPanel title="Failed to load workload" error={error} onRetry={onRetry} testId="workload-preview-error" />
      ) : isPending ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-3 text-12 text-secondary"
          data-testid="workload-preview-unavailable"
        >
          <p className="text-primary">Chưa tải được khối lượng công việc.</p>
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
        <div className="text-12 text-tertiary">Không có ai trong phạm vi này.</div>
      ) : (
        <ul className="flex flex-col gap-1.5" data-testid="workload-preview-list">
          {rows.map((row) => (
            <li
              key={row.member_id || "unassigned-roster"}
              className="flex flex-col gap-1 text-12"
              data-testid={`workload-preview-row-${row.member_id ?? "unassigned"}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-primary" title={row.display_name}>
                  {row.display_name}
                </span>
                {row.overdue > 0 ? (
                  <span className="text-danger rounded-sm bg-danger-subtle px-1.5 text-11">{row.overdue} quá hạn</span>
                ) : null}
                {row.blocked > 0 ? (
                  <span className="text-warning rounded-sm bg-warning-subtle px-1.5 text-11">
                    {row.blocked} bị chặn
                  </span>
                ) : null}
                {row.started > 0 ? (
                  <span className="rounded-sm bg-layer-2 px-1.5 text-11 text-secondary">{row.started} đang làm</span>
                ) : null}
                <span className="font-mono text-tertiary tabular-nums">{row.open} mở</span>
              </div>
              <WorkloadAllocationBar
                breakdown={row.breakdown}
                compact
                testId={`workload-preview-allocation-${row.member_id ?? "unassigned"}`}
              />
            </li>
          ))}
        </ul>
      )}
    </PanelSurface>
  );
}
