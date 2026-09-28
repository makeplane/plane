/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProjectBreakdownRow, TProjectsData } from "@plane/types";
import { OverviewDeepLink } from "../overview-deep-link";
import { PanelSurface } from "./progress-panel";
import { ScopeTimeBadge } from "./scope-time-badge";
import { ErrorPanel } from "./error-panel";
import type { TDashboardTabError } from "../error-handling";

interface Props {
  data: TProjectsData | null;
  isLoading: boolean;
  error: TDashboardTabError | null;
  onRetry: () => void;
}

export function ProjectsPreviewPanel({ data, isLoading, error, onRetry }: Props): React.ReactElement {
  const shown = data?.rows.length ?? 0;
  const total = data?.total_count ?? 0;

  return (
    <PanelSurface
      title="Theo từng dự án"
      subtitle="Việc đang mở và việc cần ưu tiên — xem chi tiết ở tab Dự án."
      isLoading={isLoading && data === null && error === null}
      error={error !== null}
      testId="projects-preview-panel"
      headerExtra={<ScopeTimeBadge kind="snapshot" />}
      footer={
        total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-2 text-11 text-tertiary">
            <span>
              Hiển thị {shown} / {total} dự án trong phạm vi
            </span>
            <OverviewDeepLink tab="projects">Xem tất cả dự án →</OverviewDeepLink>
          </div>
        ) : null
      }
    >
      {error !== null ? (
        <ErrorPanel
          title="Không tải được danh sách dự án"
          error={error}
          onRetry={onRetry}
          testId="projects-preview-error"
        />
      ) : data && data.rows.length > 0 ? (
        <ProjectsTable rows={data.rows} />
      ) : data ? (
        <p className="text-12 text-tertiary">Không có dự án nào trong phạm vi đang xem.</p>
      ) : null}
    </PanelSurface>
  );
}

function ProjectsTable({ rows }: { rows: TProjectBreakdownRow[] }): React.ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-12" data-testid="projects-preview-table">
        <thead>
          <tr className="border-b border-subtle text-left text-11 text-tertiary">
            <th className="py-1.5 pr-3 font-medium">Dự án</th>
            <th className="px-2 py-1.5 font-medium">Đang mở</th>
            <th className="px-2 py-1.5 font-medium">Quá hạn</th>
            <th className="px-2 py-1.5 font-medium">Bị chặn</th>
            <th className="py-1.5 pl-2 font-medium">Xong (kỳ)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.project_id}
              className="border-b border-subtle/60"
              data-testid={`projects-preview-row-${row.project_id}`}
            >
              <td className="max-w-[200px] truncate py-1.5 pr-3 text-primary" title={row.name}>
                {row.name}
              </td>
              <td className="font-mono px-2 py-1.5 tabular-nums">{row.open}</td>
              <td className="font-mono text-danger px-2 py-1.5 tabular-nums">{row.overdue > 0 ? row.overdue : "—"}</td>
              <td className="font-mono px-2 py-1.5 tabular-nums">{row.blocked > 0 ? row.blocked : "—"}</td>
              <td className="font-mono py-1.5 pl-2 text-secondary tabular-nums">{row.completed_in_period}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
