import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, InfoIcon, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns/member";
import { AppliedMembersFilters } from "@/components/issues";
// hooks
import { useProjectState } from "@/hooks/store";
// plane web imports
import { IStateTransition } from "@/plane-web/types";

type Props = {
  stateTransition: IStateTransition;
  workspaceSlug: string;
  projectId: string;
  transitionId: string;
  parentStateId: string;
};

export const StateTransitionApprovers = observer((props: Props) => {
  const { workspaceSlug, projectId, parentStateId, transitionId, stateTransition } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { modifyStateTransitionMemberPermission, getStateById } = useProjectState();

  const parentState = getStateById(parentStateId);
  const transitionState = getStateById(stateTransition.transition_state_id);

  const handleApproversUpdate = async (memberIds: string[]) => {
    try {
      modifyStateTransitionMemberPermission(workspaceSlug, projectId, parentStateId, transitionId, memberIds);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflows.toasts.modify_state_change_rule_movers.error.title"),
        message: t("workflows.toasts.modify_state_change_rule_movers.error.message"),
      });
    }
  };

  if (!parentState || !transitionState) return <></>;

  return (
    <>
      <hr className="border-t-[1px] border-custom-border-200 border-dashed h-[1] w-full pb-2" />
      <div className="flex flex-col pb-2 gap-1">
        <span className="flex items-center gap-1 text-xs text-custom-text-300 font-medium">
          {t("workflows.workflow_states.state_changes.movers.label")}
          <Tooltip tooltipContent={t("workflows.workflow_states.state_changes.movers.tooltip")} position="right">
            <span className="cursor-help">
              <InfoIcon className="size-3 text-custom-text-400 hover:text-custom-text-300" />
            </span>
          </Tooltip>
        </span>
        <div className="flex p-3 rounded-md border border-custom-border-100 w-full gap-2 items-center">
          <AppliedMembersFilters
            editable
            handleRemove={(value) =>
              handleApproversUpdate((stateTransition?.approvers ?? []).filter((id) => id !== value))
            }
            values={stateTransition?.approvers ?? []}
          />
          <MemberDropdown
            projectId={projectId}
            value={stateTransition?.approvers ?? []}
            onChange={handleApproversUpdate}
            button={
              <Button variant="accent-primary" size="sm" className="text-xs px-2 py-1">
                {t("workflows.workflow_states.state_changes.movers.add")}
              </Button>
            }
            buttonVariant="background-with-text"
            optionsClassName="z-10"
            multiple
          />
        </div>
      </div>
    </>
  );
});
