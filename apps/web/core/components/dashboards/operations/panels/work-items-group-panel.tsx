/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TWorkItemsGroupBy, TWorkItemsGroupData, TWorkItemsGroupRow } from "@plane/types";
import { PanelSurface } from "./progress-panel";
import { ScopeTimeBadge } from "./scope-time-badge";
import { ErrorPanel } from "./error-panel";
import type { TDashboardTabError } from "../error-handling";

const GROUP_LABELS: Record<TWorkItemsGroupBy, { title: string; column: string }> = {
  label: { title: "nhãn", column: "Nhãn" },
  project: { title: "dự án", column: "Dự án" },
  module: { title: "module", column: "Module" },
  cycle: { title: "chu kỳ", column: "Chu kỳ" },
};

interface Props {
  groupBy: TWorkItemsGroupBy;
  data: TWorkItemsGroupData | null;
  isLoading: boolean;
  error: TDashboardTabError | null;
  onRetry: () => void;
}

export function WorkItemsGroupPanel({ groupBy, data, isLoading, error, onRetry }: Props): React.ReactElement {
  const labels = GROUP_LABELS[groupBy];
  const rows: TWorkItemsGroupRow[] = data?.rows ?? [];
  const unbucketed = data?.unbucketed ?? null;

  return (
    <PanelSurface
      title={`Việc đang mở theo ${labels.title}`}
      subtitle="Hữu ích khi nhiều team dùng chung một dự án và phân loại bằng nhãn."
      isLoading={isLoading && data === null && error === null}
      error={false}
      testId="work-items-group-panel"
      headerExtra={<ScopeTimeBadge kind="snapshot" />}
      footer={
        <p className="border-t border-subtle pt-2 text-11 text-tertiary">
          Đổi cách nhóm ở mục <strong className="font-medium text-secondary">Nhóm việc theo</strong> trên thanh điều
          khiển.
        </p>
      }
    >
      {error !== null ? (
        <ErrorPanel title="Không tải được phân nhóm" error={error} onRetry={onRetry} testId="work-items-group-error" />
      ) : rows.length === 0 && unbucketed === null ? (
        <div className="text-12 text-tertiary">Không có việc đang mở trong phạm vi này.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-12" data-testid="work-items-group-table">
            <thead>
              <tr className="border-b border-subtle text-left text-11 text-tertiary">
                <th className="py-1.5 pr-3 font-medium">{labels.column}</th>
                <th className="px-2 py-1.5 font-medium">Đang mở</th>
                <th className="px-2 py-1.5 font-medium">Đang làm</th>
                <th className="px-2 py-1.5 font-medium">Quá hạn</th>
                <th className="py-1.5 pl-2 font-medium">Bị chặn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <GroupRow key={row.group_id ?? row.name} row={row} />
              ))}
              {unbucketed !== null ? <GroupRow key="__unbucketed" row={unbucketed} muted /> : null}
            </tbody>
          </table>
        </div>
      )}
    </PanelSurface>
  );
}

function GroupRow({ row, muted = false }: { row: TWorkItemsGroupRow; muted?: boolean }): React.ReactElement {
  return (
    <tr
      className={`border-b border-subtle/60 ${muted ? "text-tertiary italic" : "text-primary"}`}
      data-testid={`work-items-group-row-${row.group_id ?? "none"}`}
    >
      <td className="max-w-[240px] truncate py-1.5 pr-3" title={row.name}>
        {row.name}
      </td>
      <td className="font-mono px-2 py-1.5 tabular-nums">{row.open}</td>
      <td className="font-mono px-2 py-1.5 tabular-nums">{row.started}</td>
      <td className="font-mono text-danger px-2 py-1.5 tabular-nums">{row.overdue > 0 ? row.overdue : "—"}</td>
      <td className="font-mono py-1.5 pl-2 tabular-nums">{row.blocked > 0 ? row.blocked : "—"}</td>
    </tr>
  );
}
