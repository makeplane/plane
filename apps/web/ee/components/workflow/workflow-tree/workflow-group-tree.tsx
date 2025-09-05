import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ApproverIcon, WorkflowIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { TIssueGroupByOptions } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUser } from "@/hooks/store/user";
// local imports
import { WorkFlowEnabledMessage } from "./workflow-enabled-message";

type Props = {
  groupBy?: TIssueGroupByOptions;
  groupId: string | undefined;
};

export const WorkFlowGroupTree = observer((props: Props) => {
  const { groupBy, groupId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: user } = useUser();
  const { stateTransitionMap, getStateById, getIsWorkflowEnabled } = useProjectState();
  // derived values
  const parentState = getStateById(groupId);
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), parentState?.project_id);
  const stateTransition = groupId ? stateTransitionMap[groupId] : undefined;
  const isTransitionEnabledForState = Object.keys(stateTransition ?? {})?.length > 0;
  const isTransitionEnabledForUser = user?.id
    ? Object.values(stateTransition ?? {}).some((transition) => transition.approvers.includes(user?.id))
    : false;

  if (!isWorkflowEnabled || groupBy !== "state" || !groupId) return <></>;

  if (!isTransitionEnabledForState) return <></>;

  return (
    <Tooltip
      tooltipContent={<WorkFlowEnabledMessage parentStateId={groupId} />}
      className="p-3 border-[0.5px] border-custom-border-300 shadow-lg"
      position="bottom-start"
    >
      <div
        className={cn(
          "flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded transition-all",
          {
            "bg-[#00A0CC]/15": isTransitionEnabledForUser,
            "bg-custom-background-80 hover:bg-custom-background-80": !isTransitionEnabledForUser,
          }
        )}
      >
        {isTransitionEnabledForUser ? (
          <ApproverIcon width={14} strokeWidth={2} className="text-[#00A0CC]" />
        ) : (
          <WorkflowIcon width={14} strokeWidth={2} className="text-custom-text-200" />
        )}
      </div>
    </Tooltip>
  );
});
