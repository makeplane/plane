/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PlusIcon, XIcon } from "lucide-react";
// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IState } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type TStateTransitionListProps = {
  workspaceSlug: string;
  projectId: string;
  isEditable: boolean;
};

const StateChip = ({ state, onRemove }: { state: IState; onRemove?: () => void }) => (
  <span className="flex items-center gap-1 rounded-sm border border-subtle bg-surface-2 px-1.5 py-0.5 text-12">
    <StateGroupIcon stateGroup={state.group} color={state.color} className="h-3 w-3 flex-shrink-0" />
    <span className="truncate">{state.name}</span>
    {onRemove && (
      <button type="button" onClick={onRemove} className="text-tertiary hover:text-danger-primary">
        <XIcon className="h-3 w-3" />
      </button>
    )}
  </span>
);

export const StateTransitionList = observer(function StateTransitionList(props: TStateTransitionListProps) {
  const { workspaceSlug, projectId, isEditable } = props;
  // hooks
  const { t } = useTranslation();
  const { getProjectStates, getStateById, transitionMap, updateStateTransitions } = useProjectState();
  // derived values
  const projectStates = getProjectStates(projectId) ?? [];
  const projectTransitionMap = transitionMap[projectId] ?? {};

  const persistTransitions = async (fromStateId: string, toStateIds: string[]) => {
    try {
      await updateStateTransitions(workspaceSlug, projectId, { transitions: { [fromStateId]: toStateIds } });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("workflows.status_workflow.update_error"),
      });
    }
  };

  return (
    <div className="flex flex-col divide-y divide-subtle rounded-md border border-subtle">
      {Object.keys(STATE_GROUPS).map((group) => {
        const groupStates = projectStates.filter((state) => state.group === group);
        if (groupStates.length === 0) return null;
        return groupStates.map((state) => {
          const outgoing = projectTransitionMap[state.id] ?? [];
          const allowedStates = outgoing.map((stateId) => getStateById(stateId)).filter((s): s is IState => !!s);
          const addableOptions = projectStates
            .filter((target) => target.id !== state.id && !outgoing.includes(target.id))
            .map((target) => ({
              value: target.id,
              query: target.name,
              content: (
                <div className="flex items-center gap-2">
                  <StateGroupIcon stateGroup={target.group} color={target.color} className="h-3.5 w-3.5" />
                  <span className="truncate">{target.name}</span>
                </div>
              ),
            }));

          return (
            <div key={state.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex w-52 flex-shrink-0 items-center gap-2">
                <StateGroupIcon stateGroup={state.group} color={state.color} className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-13 font-medium text-primary">{state.name}</span>
              </div>
              <span className="flex-shrink-0 text-placeholder">→</span>
              <div className="flex flex-grow flex-wrap items-center gap-1.5">
                {allowedStates.length === 0 ? (
                  <span
                    className={cn(
                      "rounded-sm border border-dashed border-subtle px-1.5 py-0.5 text-12 text-placeholder italic"
                    )}
                  >
                    {t("workflows.status_workflow.all_states_allowed")}
                  </span>
                ) : (
                  allowedStates.map((allowedState) => (
                    <StateChip
                      key={allowedState.id}
                      state={allowedState}
                      onRemove={
                        isEditable
                          ? () =>
                              persistTransitions(
                                state.id,
                                outgoing.filter((stateId) => stateId !== allowedState.id)
                              )
                          : undefined
                      }
                    />
                  ))
                )}
                {isEditable && addableOptions.length > 0 && (
                  <CustomSearchSelect
                    value={null}
                    onChange={(targetId: string) => persistTransitions(state.id, [...outgoing, targetId])}
                    options={addableOptions}
                    customButton={
                      <span className="flex items-center gap-1 rounded-sm border border-dashed border-subtle px-1.5 py-0.5 text-12 text-tertiary hover:bg-layer-transparent-hover hover:text-primary">
                        <PlusIcon className="h-3 w-3" />
                        {t("workflows.status_workflow.add_transition")}
                      </span>
                    }
                  />
                )}
              </div>
            </div>
          );
        });
      })}
    </div>
  );
});
