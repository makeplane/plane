/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  IWorkflowFlow,
  IWorkflowFlowActor,
  TWorkflowFlowActorType,
  IWorkflowRevision,
  IWorkflowState,
} from "@plane/types";
import { CustomSearchSelect, CustomSelect, WorkflowStateList } from "@plane/ui";
// components
import { AVAILABLE_WORKFLOW_ACTOR_TYPES, getActorSummary, getActorTypeLabel } from "@/components/project-workflows";
// helpers
import { groupFlowsBySourceState } from "@/utils/workflow";
import { getWorkflowErrorMessage } from "@/utils/workflow-error";

type TWorkflowTransitionsProps = {
  states: IWorkflowState[];
  flows: IWorkflowFlow[];
  /** Client-side actor cache — the admin API has no actor read path. */
  getFlowActors: (flowId: string) => IWorkflowFlowActor[];
  isEditable: boolean;
  onAddFlow: (sourceWorkflowStateId: string, targetWorkflowStateId: string) => Promise<void>;
  onToggleFlowActive: (flowId: string, nextValue: boolean) => Promise<void>;
  onAddActor: (flowId: string, actorType: TWorkflowFlowActorType) => Promise<void>;
  onRemoveActor: (flowId: string, actorId: string) => Promise<void>;
};

export const WorkflowTransitions = observer(function WorkflowTransitions(props: TWorkflowTransitionsProps) {
  const { states, flows, getFlowActors, isEditable, onAddFlow, onToggleFlowActive, onAddActor, onRemoveActor } = props;
  const { t } = useTranslation();

  const [sourceId, setSourceId] = useState<string | undefined>(undefined);
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  const [actorFlowId, setActorFlowId] = useState<string | undefined>(undefined);
  const [pendingActorType, setPendingActorType] = useState<TWorkflowFlowActorType | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | undefined>(undefined);

  // §7.5 — the write API takes `WorkflowState` PKs, the read API returns
  // `State` UUIDs. The @plane/ui list works in the read id space, so map.
  const statesByStateId = useMemo(() => new Map(states.map((state) => [state.state_id, state] as const)), [states]);

  // Preserve the revision's state ordering (its `sequence`) while grouping
  // its flows by source state.
  const grouped = useMemo(
    () => groupFlowsBySourceState({ states, flows } as unknown as IWorkflowRevision),
    [states, flows]
  );

  const stateOptions = useMemo(
    () =>
      states.map((state) => ({
        value: state.id,
        // The value is the WorkflowState PK the write API expects.
        query: state.state_name,
        content: state.state_name,
      })),
    [states]
  );

  const actorTypeLabels = Object.fromEntries(
    AVAILABLE_WORKFLOW_ACTOR_TYPES.map((actorType) => [actorType, getActorTypeLabel(actorType)])
  ) as Record<TWorkflowFlowActorType, string>;

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.workflows.transitions.error.title"),
        // §23.5 — backend message verbatim.
        message: getWorkflowErrorMessage(error, t("project_settings.workflows.transitions.error.message")),
      });
    } finally {
      setBusyId(undefined);
    }
  };

  const handleAddFlow = () => {
    if (!sourceId || !targetId) return;
    if (sourceId === targetId) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: t("common.error"),
        message: t("project_settings.workflows.transitions.same_state"),
      });
      return;
    }
    const source = sourceId;
    const target = targetId;
    setSourceId(undefined);
    setTargetId(undefined);
    void run("add", () => onAddFlow(source, target));
  };

  const handleAddActor = () => {
    if (!actorFlowId || !pendingActorType) return;
    const flowId = actorFlowId;
    const actorType = pendingActorType;
    setPendingActorType(undefined);
    void run(flowId, () => onAddActor(flowId, actorType));
  };

  const stateListLabels = {
    allowNewWorkItems: t("project_settings.workflows.states.allow_new_work_items"),
    by: t("project_settings.workflows.transitions.by"),
    transition: t("project_settings.workflows.transitions.transition"),
    approval: t("project_settings.workflows.transitions.approval"),
    enabled: t("project_settings.workflows.transitions.active"),
    disabled: t("project_settings.workflows.transitions.disabled"),
    noActors: t("project_settings.workflows.transitions.no_actors"),
    noActorsTooltip: t("project_settings.workflows.transitions.no_actors_tooltip"),
  };

  return (
    <div className="flex flex-col">
      <h4 className="text-14 font-medium text-primary">{t("project_settings.workflows.transitions.heading")}</h4>
      <p className="text-13 text-tertiary">{t("project_settings.workflows.transitions.description")}</p>

      {/* add transition */}
      {isEditable && (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-md border border-subtle p-3">
          <div className="flex flex-col gap-1">
            <span className="text-12 text-tertiary">{t("project_settings.workflows.transitions.source")}</span>
            <CustomSearchSelect
              multiple={false}
              value={sourceId}
              onChange={(value: string) => setSourceId(value)}
              options={stateOptions}
              label={t("project_settings.workflows.transitions.source")}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-12 text-tertiary">{t("project_settings.workflows.transitions.target")}</span>
            <CustomSearchSelect
              multiple={false}
              value={targetId}
              onChange={(value: string) => setTargetId(value)}
              options={stateOptions}
              label={t("project_settings.workflows.transitions.target")}
              className="w-44"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddFlow}
            disabled={!sourceId || !targetId || busyId === "add"}
            className="mb-0.5"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" />
              {t("project_settings.workflows.transitions.add_button")}
            </span>
          </Button>
        </div>
      )}

      {/* §23.2 list — deterministic shape, no node graph (§4) */}
      {states.length === 0 ? null : (
        <div className="mt-4">
          <WorkflowStateList
            states={states.map((state) => ({
              id: state.id,
              state_id: state.state_id,
              name: state.state_name,
              group: state.state_group,
              allow_new_work_items: state.allow_new_work_items,
            }))}
            flowsBySourceStateId={Object.fromEntries(
              grouped.map(({ state, flows: stateFlows }) => [
                state.state_id,
                stateFlows.map((flow) => ({
                  id: flow.id,
                  flow_type: flow.flow_type,
                  target_state_name: flow.target_state_name,
                  reject_state_id: flow.reject_state_id,
                  is_active: flow.is_active,
                  actors: getFlowActors(flow.id).map((actor) => getActorSummary(actor.actor_type, actor.config)),
                })),
              ])
            )}
            labels={{
              ...stateListLabels,
              toggleAllowNewWorkItems: undefined,
              toggleFlowActive: (flowId, nextValue) => {
                void run(flowId, () => onToggleFlowActive(flowId, nextValue));
              },
            }}
            isEditable={isEditable}
          />
        </div>
      )}

      {/* actor editor — §12. Actors have no read path, so this is backed by
          the store's client-side cache. */}
      {isEditable && flows.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-subtle p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-12 text-tertiary">{t("project_settings.workflows.transitions.add_actor")}</span>
              <div className="flex items-center gap-2">
                <CustomSearchSelect
                  multiple={false}
                  value={actorFlowId}
                  onChange={(value: string) => setActorFlowId(value)}
                  options={flows.map((flow) => {
                    const from = statesByStateId.get(flow.source_state_id)?.state_name ?? flow.source_state_id;
                    const label = `${from} → ${flow.target_state_name}`;
                    return { value: flow.id, query: label, content: label };
                  })}
                  label={t("project_settings.workflows.transitions.actors")}
                  className="w-64"
                />
                <CustomSelect
                  value={pendingActorType ?? AVAILABLE_WORKFLOW_ACTOR_TYPES[0]}
                  onChange={(value: TWorkflowFlowActorType) => setPendingActorType(value)}
                  label={actorTypeLabels[pendingActorType ?? AVAILABLE_WORKFLOW_ACTOR_TYPES[0]]}
                  className="w-44"
                >
                  {AVAILABLE_WORKFLOW_ACTOR_TYPES.map((actorType) => (
                    <CustomSelect.Option key={actorType} value={actorType}>
                      {actorTypeLabels[actorType]}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddActor}
                  disabled={!actorFlowId || !pendingActorType}
                >
                  {t("project_settings.workflows.transitions.add_actor")}
                </Button>
              </div>
            </div>
          </div>

          {actorFlowId && getFlowActors(actorFlowId).length > 0 && (
            <ul className="flex flex-col gap-1">
              {getFlowActors(actorFlowId).map((actor) => (
                <li key={actor.id} className="flex items-center gap-2 text-12 text-secondary">
                  <span>{getActorSummary(actor.actor_type, actor.config)}</span>
                  <button
                    type="button"
                    aria-label={t("common.remove")}
                    onClick={() => void run(actor.id, () => onRemoveActor(actorFlowId, actor.id))}
                    className="rounded-sm p-0.5 text-tertiary hover:bg-layer-1 hover:text-primary"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isEditable && (
        <p className="mt-3 text-12 text-tertiary">{t("project_settings.workflows.transitions.read_only_notice")}</p>
      )}
    </div>
  );
});
