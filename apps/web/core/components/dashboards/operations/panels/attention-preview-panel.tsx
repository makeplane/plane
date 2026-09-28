/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAttentionPreviewData, TIssueRow, TAttentionRule } from "@plane/types";
import { OverviewDeepLink } from "../overview-deep-link";
import { PanelSurface } from "./progress-panel";
import { ScopeTimeBadge } from "./scope-time-badge";

interface Props {
  preview: TAttentionPreviewData | null;
  rows: TIssueRow[];
  reasonCounts: Record<string, number> | null;
  isLoading: boolean;
  error: boolean;
}

const REASON_LABEL: Record<TAttentionRule, string> = {
  overdue: "Quá hạn",
  blocked: "Bị chặn",
  due_soon: "Sắp đến hạn",
  unassigned_urgent_high: "Chưa giao · gấp",
};

export function AttentionPreviewPanel({ preview, rows, reasonCounts, isLoading, error }: Props): React.ReactElement {
  const unionTotal = preview?.union_total ?? preview?.total ?? 0;

  return (
    <PanelSurface
      title="Cần xử lý gấp"
      subtitle="Việc quá hạn, bị chặn, sắp đến hạn hoặc chưa ai nhận."
      isLoading={isLoading}
      error={error}
      testId="attention-preview-panel"
      headerExtra={<ScopeTimeBadge kind="snapshot" />}
      footer={
        unionTotal > 0 ? (
          <div className="border-t border-subtle pt-2 text-11 text-tertiary">
            <OverviewDeepLink tab="projects">Xem chi tiết trong tab Dự án / Workload →</OverviewDeepLink>
          </div>
        ) : null
      }
    >
      <AttentionBody preview={preview} rows={rows} reasonCounts={reasonCounts} isLoading={isLoading} />
    </PanelSurface>
  );
}

function AttentionBody({
  preview,
  rows,
  reasonCounts,
  isLoading,
}: {
  preview: TAttentionPreviewData | null;
  rows: TIssueRow[];
  reasonCounts: Record<string, number> | null;
  isLoading: boolean;
}): React.ReactElement {
  const effectiveRows = rows.length > 0 ? rows : (preview?.preview ?? []);
  const unionTotal = preview?.union_total ?? preview?.total ?? 0;
  const counts = reasonCounts ?? preview?.reason_counts ?? null;

  if (effectiveRows.length === 0 && !isLoading) {
    return (
      <div className="text-12 text-tertiary" data-testid="attention-preview-empty">
        Tốt — không có việc nào cần xử lý gấp trong phạm vi này.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 text-11" data-testid="attention-reason-counts">
        <span className="font-medium text-primary tabular-nums">{unionTotal}</span>
        <span className="text-tertiary">việc cần chú ý</span>
        {counts ? (
          <>
            {(["overdue", "blocked", "due_soon", "unassigned_urgent_high"] as TAttentionRule[]).map((reason) => {
              const value = counts[reason];
              if (!value) return null;
              return (
                <span
                  key={reason}
                  className="rounded-sm border border-subtle bg-layer-2 px-1.5 py-0.5 text-11 text-secondary"
                >
                  {REASON_LABEL[reason]} · {value}
                </span>
              );
            })}
          </>
        ) : null}
      </div>

      <ul className="flex flex-col gap-1.5" data-testid="attention-rows">
        {effectiveRows.slice(0, 5).map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-0.5 text-12 sm:flex-row sm:items-center sm:gap-2"
            data-testid={`attention-row-${row.id}`}
          >
            <span className="text-11 text-tertiary">{row.project_name ?? "Dự án"}</span>
            <span className="flex-1 truncate font-medium text-primary" title={row.name}>
              {row.sequence_id ? `#${row.sequence_id} · ` : ""}
              {row.name}
            </span>
            {row.target_date ? <span className="text-11 text-tertiary">Hạn {row.target_date}</span> : null}
            <div className="flex flex-wrap gap-1">
              {(row.reasons ?? []).slice(0, 2).map((reason) => (
                <span
                  key={reason}
                  className="text-warning rounded-sm bg-warning-subtle px-1.5 text-11"
                  data-testid={`attention-reason-${row.id}-${reason}`}
                >
                  {REASON_LABEL[reason]}
                </span>
              ))}
              {(row.reasons?.length ?? 0) > 2 ? (
                <span className="text-11 text-tertiary">+{(row.reasons?.length ?? 0) - 2}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {unionTotal > 5 ? <p className="text-11 text-tertiary">Hiển thị 5 / {unionTotal} việc</p> : null}
    </div>
  );
}
