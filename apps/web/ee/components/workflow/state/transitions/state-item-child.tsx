import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Info } from "lucide-react";
// plane imports
import { WORKFLOW_TRACKER_ELEMENTS, WORKFLOW_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IState } from "@plane/types";
import { Collapsible, ToggleSwitch, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StateItemTitle } from "@/components/project-states/state-item-title";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProjectState } from "@/hooks/store";
// local imports
import { StateItemContent } from "./state-item-content";
import { StateTransitionCount } from "./state-transition-count";

export type StateItemChildProps = {
  workspaceSlug: string;
  projectId: string;
  stateCount: number;
  state: IState;
};

export const StateItemChild = observer((props: StateItemChildProps) => {
  const { workspaceSlug, projectId, stateCount, state } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(true);
  // store hooks
  const {
    stateTransitionMap,
    getNextAvailableTransitionStateId,
    toggleAllowWorkItemCreationLogic,
    getIsWorkItemCreationAllowedForState,
  } = useProjectState();
  // derived state
  const isDefaultState = state.default;
  const isIssueCreationAllowedForState = getIsWorkItemCreationAllowedForState(state.id);
  const currentTransitionMap = stateTransitionMap[state.id];
  const shouldEnableAddition = !!getNextAvailableTransitionStateId(projectId, state.id);
  const currentTransitionIds = Object.keys(currentTransitionMap ?? {});

  const handleToggleAllowWorkItemCreation = async () => {
    await toggleAllowWorkItemCreationLogic(workspaceSlug, state.id)
      .then(() => {
        captureSuccess({
          eventName: WORKFLOW_TRACKER_EVENTS.TOGGLE_WORK_ITEM_CREATION,
          payload: {
            project_id: projectId,
          },
        });
      })
      .catch((error) => {
        captureError({
          eventName: WORKFLOW_TRACKER_EVENTS.TOGGLE_WORK_ITEM_CREATION,
          error: error as Error,
        });
      });
  };

  return (
    <div className="flex flex-col w-full">
      <Collapsible
        isOpen={isOpen}
        onToggle={() => setIsOpen((prevState) => !prevState)}
        className="w-full"
        buttonClassName="w-full"
        title={
          <div className="flex w-full items-center gap-2 py-2.5 px-3 bg-custom-background-90">
            <div className="w-fit flex-shrink-0">
              <StateItemTitle
                setUpdateStateModal={() => {}}
                stateCount={stateCount}
                disabled
                state={state}
                shouldShowDescription={false}
              />
            </div>
            <div className="flex grow items-center justify-between w-full">
              <StateTransitionCount currentTransitionMap={currentTransitionMap} />
              <div className="flex w-full items-center justify-end gap-3">
                <div className="flex gap-1.5">
                  <span className="text-xs text-custom-text-400 font-medium">
                    {isDefaultState ? (
                      <Tooltip position="left" tooltipContent={t("workflows.workflow_states.default_state")}>
                        <Info className="flex-shrink-0 size-4 text-custom-text-400 hover:text-custom-text-300 cursor-help" />
                      </Tooltip>
                    ) : (
                      <>{t("workflows.workflow_states.work_item_creation")}</>
                    )}
                  </span>
                  {!isDefaultState && (
                    <ToggleSwitch
                      size="sm"
                      value={isIssueCreationAllowedForState}
                      onChange={() => handleToggleAllowWorkItemCreation()}
                      label={t("workflows.workflow_states.work_item_creation")}
                      disabled={isDefaultState}
                      data-ph-element={WORKFLOW_TRACKER_ELEMENTS.ADD_NEW_WORK_ITEMS_TOGGLE_BUTTON}
                    />
                  )}
                </div>
                <ChevronDown
                  strokeWidth={2}
                  className={cn("transition-all size-4 text-custom-text-400 hover:text-custom-text-300", {
                    "rotate-180 text-custom-text-200": isOpen,
                  })}
                />
              </div>
            </div>
          </div>
        }
      >
        <StateItemContent
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          disabled
          state={state}
          transitionIds={currentTransitionIds}
          shouldEnableNewTransitionAddition={shouldEnableAddition}
        />
      </Collapsible>
    </div>
  );
});
