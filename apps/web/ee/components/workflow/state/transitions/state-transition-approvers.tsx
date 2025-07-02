import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IStateTransition } from "@plane/types";
import { InfoIcon, Tooltip } from "@plane/ui";
// components
import { AppliedMembersFilters } from "@/components/issues";
// hooks
import { useProjectState } from "@/hooks/store";

type Props = {
  stateTransition: IStateTransition;
  parentStateId: string;
  handleApproversUpdate: (memberIds: string[]) => Promise<void>;
};

export const StateTransitionApprovers = observer((props: Props) => {
  const { parentStateId, stateTransition, handleApproversUpdate } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useProjectState();

  const parentState = getStateById(parentStateId);
  const transitionState = getStateById(stateTransition.transition_state_id);

  if (!parentState || !transitionState) return <></>;

  return (
    <>
      <hr className="border-t-[1px] border-custom-border-200 border-dashed h-[1] w-full pb-2 mt-1.5" />
      <div className="flex flex-col pt-1 pb-2 gap-1">
        <span className="flex items-center gap-1 text-xs text-custom-text-300 font-medium">
          {t("workflows.workflow_states.state_changes.movers.label")}
          <Tooltip tooltipContent={t("workflows.workflow_states.state_changes.movers.tooltip")} position="right">
            <span className="cursor-help">
              <InfoIcon className="size-3 text-custom-text-400 hover:text-custom-text-300" />
            </span>
          </Tooltip>
        </span>
        <div className="flex p-3 my-1 rounded-md border border-custom-border-100 w-full gap-2 items-center">
          <AppliedMembersFilters
            editable
            handleRemove={(value) =>
              handleApproversUpdate((stateTransition?.approvers ?? []).filter((id) => id !== value))
            }
            values={stateTransition?.approvers ?? []}
          />
        </div>
      </div>
    </>
  );
});
