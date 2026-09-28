/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCycleLaneRow, TTimelineData, TTimelineDeadlineRow } from "@plane/types";
import { OverviewDeepLink } from "../overview-deep-link";
import { PanelSurface } from "./progress-panel";
import { ScopeTimeBadge } from "./scope-time-badge";
import { ErrorPanel } from "./error-panel";
import type { TDashboardTabError } from "../error-handling";

interface SharedProps {
  data: TTimelineData | null;
  isLoading: boolean;
  error: TDashboardTabError | null;
  onRetry: () => void;
}

export function CyclesPreviewPanel({ data, isLoading, error, onRetry }: SharedProps): React.ReactElement {
  const cycles = data?.cycle_lanes.rows.slice(0, 5) ?? [];
  const total = data?.cycle_lanes.total ?? 0;

  return (
    <PanelSurface
      title="Chu kỳ sprint"
      subtitle="Các chu kỳ đang chạy trong phạm vi — có thể bỏ qua nếu team không dùng cycle."
      isLoading={isLoading && data === null && error === null}
      error={error !== null}
      testId="cycles-preview-panel"
      headerExtra={<ScopeTimeBadge kind="period" />}
      footer={
        total > 5 ? (
          <div className="border-t border-subtle pt-2 text-11 text-tertiary">
            <OverviewDeepLink tab="timeline">Xem timeline đầy đủ →</OverviewDeepLink>
          </div>
        ) : null
      }
    >
      {error !== null ? (
        <ErrorPanel title="Không tải được chu kỳ" error={error} onRetry={onRetry} testId="cycles-preview-error" />
      ) : (
        <ul className="flex flex-col gap-1.5" data-testid="cycles-preview-list">
          {cycles.length === 0 ? (
            <li className="text-12 text-tertiary">Không có chu kỳ nào — team có thể chỉ dùng nhãn hoặc dự án.</li>
          ) : (
            cycles.map((cycle: TCycleLaneRow) => (
              <li key={cycle.cycle_id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-12">
                <span className="font-medium text-primary">{cycle.cycle_name}</span>
                <span className="text-11 text-tertiary">{cycle.project_name}</span>
                {cycle.overdue_badge > 0 ? (
                  <span className="text-danger rounded-sm bg-danger-subtle px-1.5 text-11">
                    {cycle.overdue_badge} quá hạn
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      )}
    </PanelSurface>
  );
}

export function DeadlinesPreviewPanel({ data, isLoading, error, onRetry }: SharedProps): React.ReactElement {
  const deadlines = data?.deadlines.rows.slice(0, 5) ?? [];
  const total = data?.deadlines.total ?? 0;

  return (
    <PanelSurface
      title="Hạn trong 7 ngày tới"
      subtitle="Việc sắp đến hạn — luôn tính từ hôm nay, không theo kỳ biểu đồ."
      isLoading={isLoading && data === null && error === null}
      error={error !== null}
      testId="deadlines-preview-panel"
      headerExtra={<ScopeTimeBadge kind="snapshot" />}
      footer={
        total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-2 text-11 text-tertiary">
            <span>
              {Math.min(5, deadlines.length)} / {total} việc có hạn
            </span>
            <OverviewDeepLink tab="timeline">Xem tất cả hạn →</OverviewDeepLink>
          </div>
        ) : null
      }
    >
      {error !== null ? (
        <ErrorPanel title="Không tải được hạn" error={error} onRetry={onRetry} testId="deadlines-preview-error" />
      ) : (
        <ul className="flex flex-col gap-1.5" data-testid="deadlines-preview-list">
          {deadlines.length === 0 ? (
            <li className="text-12 text-tertiary">Không có việc nào sắp đến hạn trong tuần này.</li>
          ) : (
            deadlines.map((row: TTimelineDeadlineRow) => (
              <li key={row.issue_id} className="flex items-center gap-2 text-12">
                <span className="flex-1 truncate text-primary" title={row.name}>
                  {row.name}
                </span>
                <span className="shrink-0 text-11 text-tertiary tabular-nums">{row.target_date ?? "—"}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </PanelSurface>
  );
}
