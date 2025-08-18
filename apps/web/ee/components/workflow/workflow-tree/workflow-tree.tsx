import { useCallback } from "react";
import { observer } from "mobx-react";
// hooks
import { useTranslation } from "@plane/i18n";
import { convertToStateTransitionTree } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member"
import { useProjectState } from "@/hooks/store/use-project-state"
import { useUser } from "@/hooks/store/user";
// local imports
import { StatePill } from "./state-pill";

type Props = {
  parentStateId: string;
};

export const WorkflowTree = observer((props: Props) => {
  const { parentStateId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: user } = useUser();
  const { stateTransitionMap } = useProjectState();
  const { getUserDetails } = useMember();
  // derived state
  const currentStateTransitionMap = stateTransitionMap[parentStateId];

  const getUserName = (moverId: string) => {
    if (moverId === user?.id) return t("common.you");
    return getUserDetails(moverId)?.display_name;
  };

  if (!currentStateTransitionMap) return <></>;

  const transitionArrays = Object.values(currentStateTransitionMap);
  const transitionTrees = convertToStateTransitionTree(transitionArrays);
  // Sort transitions to prioritize those with the current user as a mover, followed by those with other approvers, and finally those with no approvers
  const orderedTransitionTrees = transitionTrees.sort((a, b) => {
    const isCurrentUserInA = a.approvers.includes(user?.id ?? "");
    const isCurrentUserInB = b.approvers.includes(user?.id ?? "");
    const hasApproversA = a.approvers.length > 0;
    const hasApproversB = b.approvers.length > 0;

    if (isCurrentUserInA) return -1;
    if (isCurrentUserInB) return 1;
    if (hasApproversA && !hasApproversB) return -1;
    if (!hasApproversA && hasApproversB) return 1;
    return 0;
  });

  // Order approvers such that current user is last
  const getOrderedApprovers = useCallback(
    (approvers: string[]) => {
      const currentUserIndex = approvers.indexOf(user?.id ?? "");
      if (currentUserIndex !== -1) {
        return [
          ...approvers.slice(0, currentUserIndex),
          ...approvers.slice(currentUserIndex + 1),
          approvers[currentUserIndex],
        ];
      }
      return approvers;
    },
    [user?.id]
  );

  // Get a merged list of approvers
  const getMergedApproversList = useCallback(
    (approvers: string[]) => {
      const approverIds = getOrderedApprovers(approvers)
        .map((moverId) => getUserName(moverId))
        .filter((approverName) => !!approverName);

      if (approverIds.length === 0) {
        return t("entity.all", { entity: t("common.members") });
      } else if (approverIds.length === 1) {
        return approverIds[0];
      } else {
        const lastApprover = approverIds.pop();
        return `${approverIds.join(", ")} and ${lastApprover}`;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getOrderedApprovers, getUserName]
  );

  return (
    <div className="flex flex-col px-1 text-xs font-light gap-2">
      <div className="flex gap-1">
        <span>{t("workflows.workflow_tree.label")}</span>
        <StatePill stateId={parentStateId} />
      </div>
      <ul className="flex flex-col gap-y-2.5">
        {orderedTransitionTrees.map((stateTransitionTree) => (
          <li
            key={stateTransitionTree.transition_state_ids.join("-")}
            className="relative flex items-center py-1.5 px-2.5 border border-custom-border-200/50 rounded bg-custom-background-90/50"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-1 text-custom-text-200">
                <span className="flex-wrap font-medium">{getMergedApproversList(stateTransitionTree.approvers)}</span>
                <span className="flex-wrap">{t("workflows.workflow_tree.state_change_label")}</span>
              </div>
              <div className="flex flex-col gap-y-1.5">
                {stateTransitionTree.transition_state_ids.map((stateId) => (
                  <StatePill key={stateId} stateId={stateId} />
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
