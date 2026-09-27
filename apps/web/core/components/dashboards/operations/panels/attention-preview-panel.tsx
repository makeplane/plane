/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAttentionPreviewData, TIssueRow, TAttentionRule } from "@plane/types";
import { PanelSurface } from "./progress-panel";

interface Props {
  preview: TAttentionPreviewData | null;
  rows: TIssueRow[];
  reasonCounts: Record<string, number> | null;
  isLoading: boolean;
  error: boolean;
}

const REASON_LABEL: Record<TAttentionRule, string> = {
  overdue: "Overdue",
  blocked: "Blocked",
  due_soon: "Due soon",
  unassigned_urgent_high: "Unassigned · urgent/high",
};

export function AttentionPreviewPanel({ preview, rows, reasonCounts, isLoading, error }: Props): React.ReactElement {
  return (
    <PanelSurface
      title="Needs attention"
      subtitle="Distinct issues, OR'd rules; one row may carry several reason badges."
      isLoading={isLoading}
      error={error}
      testId="attention-preview-panel"
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
        No issues need attention under the current scope.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 text-11" data-testid="attention-reason-counts">
        <span className="font-mono text-primary tabular-nums">{unionTotal}</span>
        <span className="text-tertiary">distinct issues</span>
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
                  {REASON_LABEL[reason]} {value}
                </span>
              );
            })}
          </>
        ) : null}
      </div>

      <ul className="flex flex-col gap-1" data-testid="attention-rows">
        {effectiveRows.slice(0, 5).map((row) => (
          <li key={row.id} className="flex items-center gap-2 text-12" data-testid={`attention-row-${row.id}`}>
            <span className="font-mono text-11 text-tertiary" aria-hidden="true">
              {row.project_name ?? "—"}
            </span>
            <span className="flex-1 truncate text-primary" title={row.name}>
              {row.name}
            </span>
            {row.target_date ? <span className="text-11 text-tertiary">{row.target_date}</span> : null}
            {(row.reasons ?? []).map((reason) => (
              <span
                key={reason}
                className="text-warning rounded-sm bg-warning-subtle px-1.5 text-11"
                data-testid={`attention-reason-${row.id}-${reason}`}
              >
                {REASON_LABEL[reason]}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
