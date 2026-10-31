/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { Badge } from "@makeplane/propel/components/badge";
import { cn } from "@plane/utils";
// hooks
import { useFlowOverview } from "@/hooks/team-ops/use-control";

type Props = { workspaceSlug: string };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Every project's flow at a glance: how far it is, which stage holds it, who is waiting, and hand-offs nobody opened. */
export const FlowControl = observer(function FlowControl({ workspaceSlug }: Props) {
  const { overview } = useFlowOverview(workspaceSlug, true);
  const flows = overview?.flows ?? [];
  const stale = overview?.stale_handoffs ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-body-sm-regular text-secondary">
          Flows are drawn and edited in Teamflow. Here you see which are moving and which are stuck.
        </p>
        <Link
          className="text-body-sm-medium text-accent-primary hover:underline"
          href={`/${workspaceSlug}/team-ops/teamflow/`}
        >
          Open Teamflow
        </Link>
      </div>

      {overview && flows.length === 0 ? (
        <p className="rounded-lg border border-subtle bg-surface-1 p-4 text-body-sm-regular text-tertiary">
          No flows yet. Draw one for a project in Teamflow.
        </p>
      ) : null}

      <ul className="grid gap-3 lg:grid-cols-2">
        {flows.map((flow) => (
          <li key={flow.id} className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-body-md-medium text-primary">{flow.name}</h3>
                <p className="text-caption-sm-regular text-tertiary">
                  {flow.project.identifier} · {flow.project.name}
                </p>
              </div>
              {flow.finished ? (
                <Badge variant="success" size="sm" label="Finished" />
              ) : flow.people_without_tasks.length > 0 ? (
                <Badge variant="warning" size="sm" label="Waiting for tasks" />
              ) : (
                <Badge variant="brand" size="sm" label="In progress" />
              )}
            </header>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-body-xs-regular text-secondary">
                <span>{flow.finished ? "All stages done" : `Now: ${flow.current_stage}`}</span>
                <span className="tabular-nums">{flow.percent === null ? "no tasks" : `${flow.percent}%`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-layer-1" aria-hidden>
                <div
                  className={cn("h-full rounded-full", flow.finished ? "bg-success-strong" : "bg-accent-primary")}
                  style={{ width: `${flow.percent ?? 0}%` }}
                />
              </div>
            </div>
            <ol className="flex flex-wrap items-center gap-1 text-caption-sm-regular">
              {flow.stages.map((stage, index) => (
                <li key={stage.id} className="flex items-center gap-1">
                  {index > 0 ? <span className="text-tertiary">→</span> : null}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5",
                      stage.percent === 100
                        ? "bg-success-subtle text-success-primary"
                        : stage.pending
                          ? "bg-layer-1 text-tertiary"
                          : "bg-accent-subtle text-accent-primary"
                    )}
                  >
                    {stage.name} {stage.pending ? "· pending" : stage.percent === null ? "" : `· ${stage.percent}%`}
                  </span>
                </li>
              ))}
            </ol>
            {flow.people_without_tasks.length > 0 ? (
              <p className="text-body-xs-regular text-warning-primary">
                No tasks assigned yet: {flow.people_without_tasks.join(", ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <section
        aria-label="Hand-offs nobody opened"
        className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-1 p-4"
      >
        <h3 className="text-body-md-medium text-primary">
          Hand-offs not opened for {overview?.stale_after_hours ?? 48} hours
        </h3>
        {stale.length === 0 ? (
          <p className="text-body-sm-regular text-tertiary">Nothing is waiting too long.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-subtle">
            {stale.map((row, index) => (
              <li key={`${row.message}-${row.to_team.id}-${index}`} className="flex flex-col gap-0.5 py-2">
                <p className="text-body-sm-medium text-primary">
                  {row.from_team?.name ?? row.author.display_name} → {row.to_team.name}
                  {row.work_item ? <span className="text-tertiary"> · {row.work_item}</span> : null}
                </p>
                <p className="line-clamp-2 text-body-xs-regular text-secondary">{row.summary}</p>
                <p className="text-caption-sm-regular text-tertiary">
                  {row.author.display_name} · {dateFormat.format(new Date(row.created_at))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
});
