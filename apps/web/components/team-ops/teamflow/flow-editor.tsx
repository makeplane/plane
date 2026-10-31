/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { setToast } from "@plane/blocks/toast";
import type { TFlow, THubPerson } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { flowService } from "@/hooks/team-ops/use-hub";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Draft = { name: string; stages: { name: string; users: string[] }[] };

const blankDraft: Draft = { name: "", stages: [{ name: "Stage 1", users: [] }] };

type Props = {
  workspaceSlug: string;
  /** `null` to draw a new flow. */
  flow: TFlow | null;
  onDone: () => Promise<void>;
  onCancel: () => void;
};

/** An admin picks the project, names the stages and puts each person of the project into one stage. */
export const FlowEditor = observer(function FlowEditor({ workspaceSlug, flow, onDone, onCancel }: Props) {
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const [projectId, setProjectId] = useState<string | undefined>(flow?.project.id);
  const [people, setPeople] = useState<THubPerson[]>([]);
  const [draft, setDraft] = useState<Draft>(
    flow
      ? {
          name: flow.name,
          stages: flow.stages.map((stage) => ({ name: stage.name, users: stage.people.map((p) => p.user.id) })),
        }
      : blankDraft
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    flowService
      .listProjectPeople(workspaceSlug, projectId)
      .then(setPeople)
      .catch((error) => setToast({ type: "error", title: "Could not load people", message: getErrorMessage(error) }));
  }, [workspaceSlug, projectId]);

  const used = new Map<string, number>(
    draft.stages.flatMap((stage, index) => stage.users.map((id) => [id, index] as const))
  );
  const setStage = (index: number, change: Partial<Draft["stages"][number]>) =>
    setDraft({ ...draft, stages: draft.stages.map((stage, i) => (i === index ? { ...stage, ...change } : stage)) });
  const toggle = (stageIndex: number, id: string) => {
    const stage = draft.stages[stageIndex];
    setStage(stageIndex, {
      users: stage.users.includes(id) ? stage.users.filter((value) => value !== id) : [...stage.users, id],
    });
  };

  const ready =
    Boolean(projectId) &&
    draft.name.trim().length > 0 &&
    draft.stages.length > 0 &&
    draft.stages.every((stage) => stage.name.trim() && stage.users.length > 0);

  const save = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload = { project: projectId, name: draft.name, stages: draft.stages };
      if (flow) await flowService.update(workspaceSlug, flow.id, payload);
      else await flowService.create(workspaceSlug, payload);
      await onDone();
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      aria-label="Flow editor"
      className="flex flex-col gap-4 rounded-lg border border-accent-strong bg-surface-1 p-4"
    >
      <h3 className="text-body-md-medium text-primary">{flow ? "Edit flow" : "New flow"}</h3>
      <div className="flex flex-wrap gap-3">
        <div className="w-64 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Project"
            options={joinedProjectIds.map((id) => ({ value: id, label: getPartialProjectById(id)?.name ?? id }))}
            value={projectId}
            disabled={Boolean(flow)}
            onValueChange={(value) => {
              setProjectId(value ?? undefined);
              setDraft({ ...draft, stages: draft.stages.map((stage) => ({ ...stage, users: [] })) });
            }}
          />
        </div>
        <div className="min-w-64 flex-1">
          <InputField
            type="text"
            size="lg"
            orientation="vertical"
            value={draft.name}
            maxLength={200}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Name of the flow, for example Release"
            aria-label="Name of the flow"
          />
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {draft.stages.map((stage, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-md border border-subtle p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-body-sm-medium text-secondary">Stage {index + 1}</span>
              <div className="min-w-48 flex-1">
                <InputField
                  type="text"
                  size="lg"
                  orientation="vertical"
                  value={stage.name}
                  maxLength={200}
                  onChange={(event) => setStage(index, { name: event.target.value })}
                  aria-label={`Name of stage ${index + 1}`}
                />
              </div>
              {draft.stages.length > 1 ? (
                <button
                  type="button"
                  className="text-body-xs-regular text-tertiary hover:text-danger-primary"
                  onClick={() => setDraft({ ...draft, stages: draft.stages.filter((_, i) => i !== index) })}
                >
                  Remove stage
                </button>
              ) : null}
            </div>
            {projectId ? (
              <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
                <legend className="mb-1 text-body-xs-medium text-secondary">People in this stage</legend>
                {people.map((person) => {
                  const elsewhere = used.has(person.id) && used.get(person.id) !== index;
                  return (
                    <CheckboxField
                      key={person.id}
                      size="lg"
                      label={
                        elsewhere
                          ? `${person.display_name} (stage ${(used.get(person.id) ?? 0) + 1})`
                          : person.display_name
                      }
                      checked={stage.users.includes(person.id)}
                      disabled={elsewhere}
                      onCheckedChange={() => toggle(index, person.id)}
                    />
                  );
                })}
              </fieldset>
            ) : (
              <p className="text-body-xs-regular text-tertiary">Choose a project to pick people.</p>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          label="Add stage"
          disabled={draft.stages.length >= 12}
          onClick={() =>
            setDraft({ ...draft, stages: [...draft.stages, { name: `Stage ${draft.stages.length + 1}`, users: [] }] })
          }
        />
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          label="Save flow"
          loading={isSaving}
          disabled={!ready}
          onClick={save}
        />
        <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={onCancel} />
      </div>
    </section>
  );
});
