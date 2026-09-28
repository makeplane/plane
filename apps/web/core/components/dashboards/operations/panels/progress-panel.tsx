/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProgressData, TStateGroup } from "@plane/types";

interface Props {
  data: TProgressData | null;
  isLoading: boolean;
  error: boolean;
}

const STATE_COLORS: Record<TStateGroup, string> = {
  backlog: "#9ca3af",
  unstarted: "#fbbf24",
  started: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#a3a3a3",
};

const STATE_LABELS: Record<TStateGroup, string> = {
  backlog: "Chờ xếp",
  unstarted: "Chưa bắt đầu",
  started: "Đang làm",
  completed: "Đã xong",
  cancelled: "Đã hủy",
};

const GROUP_ORDER: TStateGroup[] = ["backlog", "unstarted", "started", "completed", "cancelled"];

import { ScopeTimeBadge } from "./scope-time-badge";

export function ProgressPanel({ data, isLoading, error }: Props): React.ReactElement {
  return (
    <PanelSurface
      title="Tiến độ công việc"
      subtitle="Việc đang ở trạng thái nào — nhìn nhanh tỷ lệ hoàn thành."
      isLoading={isLoading}
      error={error}
      testId="progress-panel"
      stretch
      headerExtra={<ScopeTimeBadge kind="snapshot" />}
    >
      {data ? <ProgressBody data={data} /> : null}
    </PanelSurface>
  );
}

function ProgressBody({ data }: { data: TProgressData }): React.ReactElement {
  const total = data.state_groups.reduce((sum, g) => sum + g.count, 0);
  const completionPct = data.completion_rate === null ? null : Math.round((data.completion_rate ?? 0) * 100);

  return (
    <div className="flex flex-1 flex-col gap-3" data-testid="progress-panel-body">
      <div
        className="flex h-3 overflow-hidden rounded-sm border border-subtle bg-layer-2"
        aria-label="State group distribution"
      >
        {data.state_groups.map((entry) => {
          const pct = total === 0 ? 0 : (entry.count / total) * 100;
          return (
            <div
              key={entry.group}
              className="h-full"
              style={{
                width: `${pct}%`,
                backgroundColor: STATE_COLORS[entry.group],
              }}
              data-testid={`progress-segment-${entry.group}`}
              aria-label={`${STATE_LABELS[entry.group]} ${entry.count}`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {GROUP_ORDER.map((group) => {
          const entry = data.state_groups.find((s) => s.group === group);
          if (!entry || entry.count === 0) return null;
          const pct = total === 0 ? 0 : (entry.count / total) * 100;
          return (
            <span key={group} className="inline-flex items-center gap-1 text-11 text-secondary">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: STATE_COLORS[group] }}
                aria-hidden="true"
              />
              <span>{STATE_LABELS[group]}</span>
              <span className="font-mono text-primary tabular-nums">{entry.count}</span>
              <span className="text-tertiary">({pct.toFixed(0)}%)</span>
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-11 text-tertiary">
        <span>Total {total}</span>
        <span data-testid="progress-completion-summary">
          Hoàn thành {completionPct === null ? "—" : `${completionPct}%`} (trên {data.denominator} việc)
        </span>
      </div>
    </div>
  );
}

interface PanelSurfaceProps {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  error: boolean;
  testId: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  /** Stretch panel to fill a grid row (equal-height overview widgets). */
  stretch?: boolean;
  children?: React.ReactNode;
}

export function PanelSurface({
  title,
  subtitle,
  isLoading,
  error,
  testId,
  headerExtra,
  footer,
  stretch = false,
  children,
}: PanelSurfaceProps): React.ReactElement {
  return (
    <section
      className={`flex min-h-[210px] flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4${stretch ? " h-full w-full flex-1" : ""}`}
      data-testid={testId}
    >
      <header className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-13 font-medium text-primary">{title}</h2>
          {headerExtra}
        </div>
        {subtitle ? <p className="text-11 text-tertiary">{subtitle}</p> : null}
      </header>
      {isLoading && !error ? (
        <div
          className="flex flex-1 items-center justify-center text-12 text-tertiary"
          data-testid={`${testId}-loading`}
        >
          Đang tải…
        </div>
      ) : error ? (
        <div className="text-danger flex flex-1 items-center justify-center text-12" data-testid={`${testId}-error`}>
          Không tải được dữ liệu
        </div>
      ) : (
        <div className={stretch ? "flex min-h-0 flex-1 flex-col" : undefined}>{children}</div>
      )}
      {footer}
    </section>
  );
}
