/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IState, IWorkflowRevision } from "@plane/types";
import { CustomSearchSelect, Loader, ToggleSwitch } from "@plane/ui";
// helpers
import { getWorkflowErrorMessage } from "@/utils/workflow-error";

type TWorkflowStatesProps = {
  revision: IWorkflowRevision;
  /** All project states, so the admin can add the ones not yet included. */
  projectStates: IState[] | undefined;
  isLoading: boolean;
  /** Only draft revisions are mutable (§17.2). */
  isEditable: boolean;
  onAdd: (stateId: string) => Promise<void>;
  onToggleAllowNewWorkItems: (workflowStateId: string, nextValue: boolean) => Promise<void>;
  onRemove: (workflowStateId: string) => Promise<void>;
};

export const WorkflowStates = observer(function WorkflowStates(props: TWorkflowStatesProps) {
  const { revision, projectStates, isLoading, isEditable, onAdd, onToggleAllowNewWorkItems, onRemove } = props;
  const { t } = useTranslation();

  const [pendingStateId, setPendingStateId] = useState<string | undefined>(undefined);
  const [busyStateId, setBusyStateId] = useState<string | undefined>(undefined);

  const includedStateIds = new Set(revision.states.map((state) => state.state_id));
  // The state write API takes `plane.db.State` UUIDs.
  const addableOptions = (projectStates ?? [])
    .filter((state) => !includedStateIds.has(state.id))
    .map((state) => ({ value: state.id, query: state.name, content: state.name }));

  const run = async (stateId: string, action: () => Promise<void>, fallback: string) => {
    setBusyStateId(stateId);
    try {
      await action();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.workflows.states.error.title"),
        // §23.5 — backend message verbatim.
        message: getWorkflowErrorMessage(error, fallback),
      });
      throw error;
    } finally {
      setBusyStateId(undefined);
    }
  };

  const handleAdd = async () => {
    if (!pendingStateId) return;
    const stateId = pendingStateId;
    setPendingStateId(undefined);
    await run(stateId, () => onAdd(stateId), t("project_settings.workflows.states.error.message")).catch(
      () => undefined
    );
  };

  if (isLoading) {
    return (
      <Loader className="space-y-3">
        <Loader.Item height="32px" />
        <Loader.Item height="32px" />
        <Loader.Item height="32px" />
      </Loader>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-14 font-medium text-primary">{t("project_settings.workflows.states.heading")}</h4>
          <p className="text-13 text-tertiary">{t("project_settings.workflows.states.description")}</p>
        </div>
        {isEditable && addableOptions.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            <CustomSearchSelect
              multiple={false}
              value={pendingStateId}
              onChange={(value: string) => setPendingStateId(value)}
              options={addableOptions}
              label={t("project_settings.workflows.states.add_button")}
              noResultsMessage={t("project_settings.workflows.states.all_included")}
              className="w-48"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAdd}
              disabled={!pendingStateId}
              aria-label={t("project_settings.workflows.states.add_button")}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {revision.states.length === 0 ? (
        <EmptyStateCompact
          assetKey="state"
          title={t("project_settings.workflows.states.empty_state.title")}
          description={t("project_settings.workflows.states.empty_state.description")}
          className="mt-4 p-8"
        />
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-subtle">
          {revision.states.map((state) => (
            <li key={state.id} className="flex items-center gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: projectStates?.find((s) => s.id === state.state_id)?.color }}
                />
                <span className="truncate text-13 text-primary">{state.state_name}</span>
                <span className="shrink-0 text-11 text-tertiary">{state.state_group}</span>
              </div>

              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-12 text-tertiary">
                <ToggleSwitch
                  value={state.allow_new_work_items}
                  disabled={!isEditable || busyStateId === state.id}
                  onChange={(value) => {
                    void run(
                      state.id,
                      () => onToggleAllowNewWorkItems(state.id, value),
                      t("project_settings.workflows.states.error.message")
                    ).catch(() => undefined);
                  }}
                />
                {t("project_settings.workflows.states.allow_new_work_items")}
              </label>

              {isEditable && (
                <button
                  type="button"
                  aria-label={t("common.remove")}
                  disabled={busyStateId === state.id}
                  onClick={() => {
                    void run(
                      state.id,
                      () => onRemove(state.id),
                      t("project_settings.workflows.states.error.message")
                    ).catch(() => undefined);
                  }}
                  className="shrink-0 rounded-sm p-1 text-tertiary hover:bg-layer-1 hover:text-primary disabled:opacity-50"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
