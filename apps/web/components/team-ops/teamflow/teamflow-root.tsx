/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import { SelectField } from "@makeplane/propel/components/select-field";
import { setToast } from "@plane/blocks/toast";
import { addDays, toDateKey } from "@plane/services";
import type { TTeamflow, TTeamflowStatus } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { hubService } from "@/hooks/team-ops/use-hub";
import { useTeamflow } from "@/hooks/team-ops/use-workday";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = { workspaceSlug: string };

const ALL = "all";
const STATUS_OPTIONS = [
  { value: ALL, label: "All hand-offs" },
  { value: "pending", label: "Waiting to be opened" },
  { value: "delivered", label: "Delivered (opened)" },
];
const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
];

const WIDTH = 720;
const HEIGHT = 340;
const RADIUS = 28;

/** Teams placed on a circle; the arrows between them carry the number of hand-offs. */
export function PipelineGraph({ flow }: { flow: TTeamflow }) {
  const positions = useMemo(() => {
    const count = flow.nodes.length;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const radiusX = WIDTH / 2 - 90;
    const radiusY = HEIGHT / 2 - 50;
    return new Map(
      flow.nodes.map((node, index) => {
        if (count === 1) return [node.id, { x: centerX, y: centerY }];
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
        return [node.id, { x: centerX + radiusX * Math.cos(angle), y: centerY + radiusY * Math.sin(angle) }];
      })
    );
  }, [flow.nodes]);

  if (flow.nodes.length === 0) {
    return <p className="text-body-sm-regular text-tertiary">There are no teams yet.</p>;
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Hand-offs between teams"
      className="h-auto w-full rounded-lg border border-subtle bg-surface-1"
    >
      <defs>
        <marker
          id="flow-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: "var(--text-color-tertiary)" }} />
        </marker>
      </defs>
      {flow.edges.map((edge) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        // Start and end at the rim of the circles, and bend a little so A to B and B to A do not overlap.
        const startX = from.x + (dx / length) * RADIUS;
        const startY = from.y + (dy / length) * RADIUS;
        const endX = to.x - (dx / length) * (RADIUS + 6);
        const endY = to.y - (dy / length) * (RADIUS + 6);
        const bend = 22;
        const controlX = (startX + endX) / 2 + (-dy / length) * bend;
        const controlY = (startY + endY) / 2 + (dx / length) * bend;
        const labelX = (startX + 2 * controlX + endX) / 4;
        const labelY = (startY + 2 * controlY + endY) / 4;
        const total = edge.pending + edge.delivered;
        return (
          <g key={`${edge.from}-${edge.to}`}>
            <path
              d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              strokeWidth={Math.min(6, 1.5 + total)}
              stroke={edge.pending > 0 ? "var(--border-color-warning-strong)" : "var(--border-color-success-strong)"}
              markerEnd="url(#flow-arrow)"
            />
            <text
              x={labelX}
              y={labelY - 4}
              textAnchor="middle"
              style={{ fill: "var(--text-color-primary)" }}
              fontSize="12"
              fontWeight="600"
            >
              {edge.pending > 0 ? `${edge.pending} waiting` : ""}
              {edge.pending > 0 && edge.delivered > 0 ? " · " : ""}
              {edge.delivered > 0 ? `${edge.delivered} delivered` : ""}
            </text>
          </g>
        );
      })}
      {flow.nodes.map((node) => {
        const position = positions.get(node.id)!;
        return (
          <g key={node.id}>
            <circle
              cx={position.x}
              cy={position.y}
              r={RADIUS}
              style={{ fill: "var(--background-color-layer-1)", stroke: "var(--border-color-strong)", strokeWidth: 2 }}
            />
            <text
              x={position.x}
              y={position.y + RADIUS + 16}
              textAnchor="middle"
              fontSize="12"
              fontWeight="500"
              style={{ fill: "var(--text-color-primary)" }}
            >
              {node.name.length > 18 ? `${node.name.slice(0, 17)}…` : node.name}
            </text>
            <text
              x={position.x}
              y={position.y + 5}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              style={{ fill: "var(--text-color-secondary)" }}
            >
              {node.name.slice(0, 2).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Documents and hand-offs between teams, with who has opened them. */
export const TeamflowRoot = observer(function TeamflowRoot({ workspaceSlug }: Props) {
  // states
  const [status, setStatus] = useState<string>(ALL);
  const [teamId, setTeamId] = useState<string>(ALL);
  const [days, setDays] = useState("30");
  // hooks
  const params = useMemo(
    () => ({
      status: status === ALL ? undefined : (status as TTeamflowStatus),
      team: teamId === ALL ? undefined : teamId,
      from: addDays(toDateKey(new Date()), -Number(days)),
      to: toDateKey(new Date()),
    }),
    [status, teamId, days]
  );
  const { flow, error, isLoading } = useTeamflow(workspaceSlug, params);
  const teamOptions = [
    { value: ALL, label: "All teams" },
    ...(flow?.nodes ?? []).map((node) => ({ value: node.id, label: node.name })),
  ];

  const openFile = async (fileId: string) => {
    try {
      const { url } = await hubService.getFileLink(workspaceSlug, fileId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (failure) {
      setToast({ type: "error", title: "Could not open the file", message: getErrorMessage(failure) });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-h4-medium text-primary">Teamflow</h1>
        <p className="text-body-sm-regular text-secondary">
          Work and documents handed from one team to another. A hand-off is delivered once someone in the receiving team
          has opened it in the Hub.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-52 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Show"
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={(value) => setStatus(value ?? ALL)}
          />
        </div>
        <div className="w-44 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Team"
            options={teamOptions}
            value={teamId}
            onValueChange={(value) => setTeamId(value ?? ALL)}
          />
        </div>
        <div className="w-44 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Period"
            options={PERIOD_OPTIONS}
            value={days}
            onValueChange={(value) => setDays(value ?? "30")}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm-regular text-danger-primary">
          {getErrorMessage(error)}
        </p>
      ) : null}

      {flow ? <PipelineGraph flow={flow} /> : <p className="text-body-sm-regular text-tertiary">Loading...</p>}

      <section className="flex flex-col gap-2" aria-label="Hand-offs">
        <h2 className="text-body-md-medium text-primary">Hand-offs</h2>
        {flow && flow.results.length === 0 && !isLoading ? (
          <p className="rounded-lg border border-subtle bg-surface-1 p-4 text-body-sm-regular text-tertiary">
            Nothing here for this filter. When someone finishes work and marks it as needing attention, or tags a team
            in the Hub, it shows up here.
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {(flow?.results ?? []).map((row, index) => (
            <li
              key={`${row.message}-${row.to_team.id}-${index}`}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border bg-surface-1 p-4",
                row.status === "pending" ? "border-warning-strong" : "border-subtle"
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-body-sm-medium text-primary">
                <span>{row.from_team?.name ?? row.author.display_name}</span>
                <span aria-hidden className="text-tertiary">
                  →
                </span>
                <span>{row.to_team.name}</span>
                <Badge
                  variant={row.status === "delivered" ? "success" : "warning"}
                  size="sm"
                  label={row.status === "delivered" ? "Delivered" : "Waiting"}
                />
                {row.work_item ? <span className="text-caption-sm-regular text-tertiary">{row.work_item}</span> : null}
                <span className="ml-auto text-caption-sm-regular text-tertiary">
                  {row.author.display_name} · {dateFormat.format(new Date(row.created_at))}
                </span>
              </div>
              <p className="line-clamp-3 text-body-sm-regular whitespace-pre-line text-secondary">{row.summary}</p>
              {row.files.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {row.files.map((file) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        className="rounded-md border border-subtle px-2.5 py-1 text-body-xs-regular text-accent-primary hover:bg-layer-1"
                        onClick={() => openFile(file.id)}
                      >
                        {file.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
});
