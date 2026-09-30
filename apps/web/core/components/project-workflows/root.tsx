/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import type { IProjectWorkflowStates, IWorkflow, IWorkflowFlow, TWorkflowFlowType } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { useWorkflow } from "@/hooks/store/use-workflow";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectWorkflowRoot = observer(function ProjectWorkflowRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const workflowStore = useWorkflow();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const projectData = workflowStore.getProjectWorkflowStates(projectId);
  const workflows = projectData?.workflows ?? [];
  const selectedWorkflow = workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? workflows[0];

  useEffect(() => {
    workflowStore.fetchProjectWorkflowStates(workspaceSlug, projectId);
  }, [workspaceSlug, projectId, workflowStore]);

  const defaultWorkflowId = workflows.find((workflow) => workflow.is_default)?.id ?? workflows[0]?.id ?? null;

  useEffect(() => {
    if (!selectedWorkflowId && defaultWorkflowId) {
      setSelectedWorkflowId(defaultWorkflowId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWorkflowId, selectedWorkflowId]);

  const handleToggleEnabled = async (enabled: boolean) => {
    const promise = workflowStore.toggleWorkflowEnabled(workspaceSlug, projectId, enabled);
    setPromiseToast(promise, {
      loading: t("project_settings.workflows.enabling"),
      success: {
        title: t("common.success"),
        message: () =>
          enabled ? t("project_settings.workflows.enabled_success") : t("project_settings.workflows.disabled_success"),
      },
      error: {
        title: t("common.error.label"),
        message: () => t("project_settings.workflows.toggle_error"),
      },
    });
    await promise;
  };

  const handleSaveConfiguration = async (stateConfigs: IWorkflow["state_configs"], flows: IWorkflowFlow[]) => {
    if (!selectedWorkflow) return;
    const promise = workflowStore.configureWorkflow(workspaceSlug, projectId, selectedWorkflow.id, {
      state_configs: stateConfigs,
      flows,
    });
    setPromiseToast(promise, {
      loading: t("common.saving"),
      success: {
        title: t("common.success"),
        message: () => t("project_settings.workflows.save_success"),
      },
      error: {
        title: t("common.error.label"),
        message: () => t("project_settings.workflows.save_error"),
      },
    });
    await promise;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-md border border-subtle bg-surface-1 p-4">
        <div>
          <h4 className="text-13 font-medium">{t("project_settings.workflows.enable_title")}</h4>
          <p className="mt-1 text-11 text-tertiary">{t("project_settings.workflows.enable_description")}</p>
        </div>
        <ToggleSwitch
          value={workflowStore.isWorkflowEnabledForProject(projectId)}
          onChange={handleToggleEnabled}
          size="sm"
        />
      </div>

      {workflowStore.isWorkflowEnabledForProject(projectId) && (
        <>
          <div className="flex flex-wrap gap-2">
            {workflows.map((workflow) => (
              <button
                key={workflow.id}
                type="button"
                onClick={() => setSelectedWorkflowId(workflow.id)}
                className={`rounded-md border px-3 py-1.5 text-12 ${
                  selectedWorkflow?.id === workflow.id
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "border-subtle text-secondary hover:bg-layer-1"
                }`}
              >
                {workflow.name}
                {workflow.is_paused ? ` (${t("project_settings.workflows.paused")})` : ""}
              </button>
            ))}
          </div>

          {selectedWorkflow && (
            <WorkflowBuilder
              key={selectedWorkflow.id}
              workflow={selectedWorkflow}
              states={projectData?.states ?? []}
              onSave={handleSaveConfiguration}
            />
          )}
        </>
      )}
    </div>
  );
});

type BuilderProps = {
  workflow: IWorkflow;
  states: IProjectWorkflowStates["states"];
  onSave: (stateConfigs: IWorkflow["state_configs"], flows: IWorkflowFlow[]) => Promise<void>;
};

function WorkflowBuilder(props: BuilderProps) {
  const { workflow, states, onSave } = props;
  const { t } = useTranslation();
  const [expandedStateId, setExpandedStateId] = useState<string | null>(states[0]?.id ?? null);
  const [stateConfigs, setStateConfigs] = useState(workflow.state_configs);
  const [flows, setFlows] = useState(workflow.flows);

  useEffect(() => {
    setStateConfigs(workflow.state_configs);
    setFlows(workflow.flows);
  }, [workflow]);

  const getConfigForState = (stateId: string) =>
    stateConfigs.find((config) => config.state_id === stateId) ?? {
      state_id: stateId,
      allow_work_item_creation: true,
      sequence: 0,
    };

  const addFlow = (sourceStateId: string, flowType: TWorkflowFlowType) => {
    const defaultTarget = states.find((state) => state.id !== sourceStateId);
    if (!defaultTarget) return;

    setFlows((current) => [
      ...current,
      {
        id: `temp-${Date.now()}`,
        workflow_id: workflow.id,
        source_state_id: sourceStateId,
        flow_type: flowType,
        target_state_id: defaultTarget.id,
        reject_state_id: flowType === "approval" ? sourceStateId : null,
        allowed_roles: [],
        allowed_members: [],
        sequence: (current.length + 1) * 10000,
      } as IWorkflowFlow,
    ]);
  };

  const updateFlow = (index: number, patch: Partial<IWorkflowFlow>) => {
    setFlows((current) => current.map((flow, flowIndex) => (flowIndex === index ? { ...flow, ...patch } : flow)));
  };

  const removeFlow = (index: number) => {
    setFlows((current) => current.filter((_, flowIndex) => flowIndex !== index));
  };

  const handleSave = () => {
    const normalizedConfigs = states.map((state, index) => {
      const config = getConfigForState(state.id);
      return {
        state_id: state.id,
        allow_work_item_creation: config.allow_work_item_creation,
        sequence: state.sequence ?? (index + 1) * 10000,
      };
    });

    const normalizedFlows = flows.map((flow, index) => ({
      source_state_id: flow.source_state_id,
      flow_type: flow.flow_type,
      target_state_id: flow.target_state_id,
      reject_state_id: flow.reject_state_id,
      allowed_roles: flow.allowed_roles ?? [],
      allowed_members: flow.allowed_members ?? [],
      sequence: (index + 1) * 10000,
    }));

    onSave(normalizedConfigs as IWorkflow["state_configs"], normalizedFlows as IWorkflowFlow[]);
  };

  return (
    <div className="rounded-md border border-subtle">
      <div className="border-b border-subtle px-4 py-3">
        <h4 className="text-13 font-medium">{t("project_settings.workflows.builder_title")}</h4>
        <p className="mt-1 text-11 text-tertiary">{t("project_settings.workflows.builder_description")}</p>
      </div>

      <div className="divide-y divide-subtle">
        {states.map((state) => {
          const stateFlows = flows
            .map((flow, index) => ({ flow, index }))
            .filter(({ flow }) => flow.source_state_id === state.id);
          const config = getConfigForState(state.id);
          const isExpanded = expandedStateId === state.id;

          return (
            <div key={state.id} className="px-4 py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setExpandedStateId(isExpanded ? null : state.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: state.color }} />
                  <span className="text-13 font-medium">{state.name}</span>
                  <span className="text-11 text-placeholder">{state.group}</span>
                </div>
                <span className="text-11 text-tertiary">{stateFlows.length} flows</span>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-3 pl-4">
                  <label className="flex items-center gap-2 text-12 text-secondary">
                    <input
                      type="checkbox"
                      checked={config.allow_work_item_creation}
                      onChange={(event) => {
                        const allow = event.target.checked;
                        setStateConfigs((current) => {
                          const existing = current.find((item) => item.state_id === state.id);
                          if (existing) {
                            return current.map((item) =>
                              item.state_id === state.id ? { ...item, allow_work_item_creation: allow } : item
                            );
                          }
                          return [
                            ...current,
                            {
                              id: `temp-${state.id}`,
                              workflow_id: workflow.id,
                              state_id: state.id,
                              allow_work_item_creation: allow,
                              sequence: state.sequence,
                            },
                          ];
                        });
                      }}
                    />
                    {t("project_settings.workflows.allow_creation")}
                  </label>

                  {stateFlows.map(({ flow, index }) => (
                    <div
                      key={`${flow.id}-${index}`}
                      className="grid gap-2 rounded-md border border-subtle p-3 md:grid-cols-4"
                    >
                      <select
                        className="rounded border border-subtle bg-surface-1 px-2 py-1 text-12"
                        value={flow.flow_type}
                        onChange={(event) => updateFlow(index, { flow_type: event.target.value as TWorkflowFlowType })}
                      >
                        <option value="transition">{t("project_settings.workflows.transition")}</option>
                        <option value="approval">{t("project_settings.workflows.approval")}</option>
                      </select>
                      <select
                        className="rounded border border-subtle bg-surface-1 px-2 py-1 text-12"
                        value={flow.target_state_id}
                        onChange={(event) => updateFlow(index, { target_state_id: event.target.value })}
                      >
                        {states.map((targetState) => (
                          <option key={targetState.id} value={targetState.id}>
                            {targetState.name}
                          </option>
                        ))}
                      </select>
                      {flow.flow_type === "approval" && (
                        <select
                          className="rounded border border-subtle bg-surface-1 px-2 py-1 text-12"
                          value={flow.reject_state_id ?? ""}
                          onChange={(event) => updateFlow(index, { reject_state_id: event.target.value })}
                        >
                          {states.map((targetState) => (
                            <option key={targetState.id} value={targetState.id}>
                              {targetState.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        className="text-12 text-danger-primary hover:underline"
                        onClick={() => removeFlow(index)}
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-subtle px-2 py-1 text-12 hover:bg-layer-1"
                      onClick={() => addFlow(state.id, "transition")}
                    >
                      + {t("project_settings.workflows.add_transition")}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-subtle px-2 py-1 text-12 hover:bg-layer-1"
                      onClick={() => addFlow(state.id, "approval")}
                    >
                      + {t("project_settings.workflows.add_approval")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-subtle px-4 py-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-accent-primary px-3 py-1.5 text-12 font-medium text-on-color"
        >
          {t("common.save_changes")}
        </button>
      </div>
    </div>
  );
}
