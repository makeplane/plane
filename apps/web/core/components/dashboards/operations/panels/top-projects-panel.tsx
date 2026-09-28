/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTopProjectsData } from "@plane/types";
import { PanelSurface } from "./progress-panel";
import { ScopeTimeBadge } from "./scope-time-badge";

interface Props {
  data: TTopProjectsData | null;
  isLoading: boolean;
  error: boolean;
}

export function TopProjectsPanel({ data, isLoading, error }: Props): React.ReactElement {
  return (
    <PanelSurface
      title="Dự án cần chú ý"
      subtitle="Dự án có nhiều việc quá hạn hoặc bị chặn nhất."
      isLoading={isLoading}
      error={error}
      testId="top-projects-panel"
      stretch
      headerExtra={<ScopeTimeBadge kind="snapshot" />}
    >
      {data ? <TopProjectsBody data={data} /> : null}
    </PanelSurface>
  );
}

function TopProjectsBody({ data }: { data: TTopProjectsData }): React.ReactElement {
  if (data.top.length === 0) {
    return (
      <div className="text-12 text-tertiary" data-testid="top-projects-empty">
        No projects in scope.
      </div>
    );
  }
  const maxOpen = Math.max(1, ...data.top.map((p) => p.open));
  return (
    <div className="flex flex-1 flex-col gap-1.5" data-testid="top-projects-list">
      {data.top.map((project) => (
        <div key={project.project_id} className="flex items-center gap-2 text-12">
          <span className="flex-1 truncate text-primary" title={project.name}>
            {project.name}
          </span>
          <span className="font-mono text-tertiary tabular-nums" data-testid={`top-project-open-${project.project_id}`}>
            {project.open}
          </span>
          <div
            className="h-1.5 rounded-sm bg-layer-3"
            style={{
              width: `${Math.max(8, (project.open / maxOpen) * 60)}px`,
              background: "#3b82f6",
            }}
            aria-hidden="true"
          />
          {project.overdue > 0 ? (
            <span
              className="text-danger rounded-sm bg-danger-subtle px-1.5 text-11"
              data-testid={`top-project-overdue-${project.project_id}`}
            >
              {project.overdue} quá hạn
            </span>
          ) : null}
          {project.blocked > 0 ? (
            <span
              className="text-warning rounded-sm bg-warning-subtle px-1.5 text-11"
              data-testid={`top-project-blocked-${project.project_id}`}
            >
              {project.blocked} bị chặn
            </span>
          ) : null}
        </div>
      ))}
      <div className="text-11 text-tertiary">
        Top {data.shown} / {data.total_projects_in_scope} dự án trong phạm vi
      </div>
    </div>
  );
}
