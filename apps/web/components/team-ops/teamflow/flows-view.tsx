/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useState } from "react";
import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import type { TFlow, TFlowStage } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { flowService, useFlows } from "@/hooks/team-ops/use-hub";
// local imports
import { getErrorMessage } from "../calendar/error-message";
import { FlowEditor } from "./flow-editor";

type Props = { workspaceSlug: string };

const Bar = ({ percent }: { percent: number | null }) => (
  <div className="h-1.5 overflow-hidden rounded-full bg-layer-1" aria-hidden>
    <div
      className={cn("h-full rounded-full", percent === 100 ? "bg-success-strong" : "bg-accent-primary")}
      style={{ width: `${percent ?? 0}%` }}
    />
  </div>
);

function StageColumn({ stage, index }: { stage: TFlowStage; index: number }) {
  return (
    <section
      aria-label={`Stage ${index + 1}: ${stage.name}`}
      className={cn(
        "flex w-56 shrink-0 flex-col gap-2 rounded-lg border p-3",
        stage.pending ? "border-subtle bg-layer-1" : "border-accent-strong bg-surface-1"
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-caption-sm-regular text-tertiary">Stage {index + 1}</p>
          <h4 className="truncate text-body-sm-medium text-primary">{stage.name}</h4>
        </div>
        {stage.pending ? (
          <Badge variant="neutral" size="sm" label="Pending" />
        ) : (
          <span className="text-body-sm-medium text-primary tabular-nums">
            {stage.percent === null ? "—" : `${stage.percent}%`}
          </span>
        )}
      </header>
      <ul className="flex flex-col gap-2">
        {stage.people.map((person) => (
          <li key={person.user.id} className="flex flex-col gap-1 rounded-md border border-subtle bg-surface-1 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-body-xs-medium text-primary">{person.user.display_name}</span>
              {stage.pending ? (
                <span className="text-caption-sm-medium text-warning-primary">Pending</span>
              ) : (
                <span className="text-caption-sm-medium text-secondary tabular-nums">
                  {person.percent === null ? "no tasks" : `${person.percent}%`}
                </span>
              )}
            </div>
            {!stage.pending ? <Bar percent={person.percent} /> : null}
            {!stage.pending && person.total > 0 ? (
              <span className="text-caption-sm-regular text-tertiary">
                {person.done} of {person.total} tasks done
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FlowChart({ flow }: { flow: TFlow }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-stretch gap-1">
        {flow.stages.map((stage, index) => (
          <Fragment key={stage.id}>
            {index > 0 ? (
              <div aria-hidden className="flex w-8 shrink-0 items-center justify-center text-h5-medium text-tertiary">
                →
              </div>
            ) : null}
            <StageColumn stage={stage} index={index} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** One flowchart per project: who works with whom, stage by stage, and how far each person is. */
export const FlowsView = observer(function FlowsView({ workspaceSlug }: Props) {
  const { flows, canManage, refresh } = useFlows(workspaceSlug);
  const [editing, setEditing] = useState<TFlow | "new" | null>(null);

  const remove = async (flow: TFlow) => {
    try {
      await flowService.remove(workspaceSlug, flow.id);
      await refresh();
    } catch (error) {
      setToast({ type: "error", title: "Could not delete", message: getErrorMessage(error) });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-body-sm-regular text-secondary">
          Each flow shows the people of a project in stages. A person&apos;s box shows how many of their tasks in the
          project are done. A stage stays <b>Pending</b> until every stage before it is finished.
        </p>
        {canManage ? (
          <Button variant="primary" size="md" stretch="auto" label="New flow" onClick={() => setEditing("new")} />
        ) : null}
      </div>

      {editing ? (
        <FlowEditor
          workspaceSlug={workspaceSlug}
          flow={editing === "new" ? null : editing}
          onDone={async () => {
            setEditing(null);
            await refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {flows && flows.length === 0 ? (
        <p className="rounded-lg border border-subtle bg-surface-1 p-4 text-body-sm-regular text-tertiary">
          {canManage
            ? "No flows yet. Create one for a project to show who works with whom."
            : "There is no flow for your projects yet. An admin draws them."}
        </p>
      ) : null}

      {(flows ?? []).map((flow) => (
        <article key={flow.id} className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-body-md-medium text-primary">{flow.name}</h3>
              <p className="text-caption-sm-regular text-tertiary">
                {flow.project.identifier} · {flow.project.name}
              </p>
            </div>
            {canManage ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" stretch="auto" label="Edit" onClick={() => setEditing(flow)} />
                <Button variant="secondary" size="sm" stretch="auto" label="Delete" onClick={() => void remove(flow)} />
              </div>
            ) : null}
          </header>
          <FlowChart flow={flow} />
        </article>
      ))}
    </div>
  );
});
