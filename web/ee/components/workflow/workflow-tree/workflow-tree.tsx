import { observer } from "mobx-react";
// hooks
import { useTranslation } from "@plane/i18n";
import { useMember, useProjectState, useUser } from "@/hooks/store";
// local imports
import { StatePill } from "./state-pill";

type Props = {
  parentStateId: string;
  showCurrentUserName?: boolean;
};

export const WorkflowTree = observer((props: Props) => {
  const { parentStateId, showCurrentUserName = true } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: user } = useUser();
  const { stateTransitionMap } = useProjectState();
  const { getUserDetails } = useMember();
  // derived state
  const currentStateTransitionMap = stateTransitionMap[parentStateId];

  const getUserName = (moverId: string) => {
    if (!showCurrentUserName && moverId === user?.id) return t("common.you");
    return getUserDetails(moverId)?.display_name;
  };

  if (!currentStateTransitionMap) return <></>;

  const transitionArrays = Object.values(currentStateTransitionMap);
  // Sort transitions to prioritize those with the current user as a mover, followed by those with other approvers, and finally those with no approvers
  const orderedTransitions = transitionArrays.sort((a, b) => {
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

  return (
    <div className="flex flex-col px-1 text-xs font-light gap-2">
      <div className="flex gap-1">
        <span>{t("workflows.workflow_tree.label")}</span>
        <StatePill stateId={parentStateId} />
      </div>
      <ul className="flex flex-col gap-y-2.5">
        {orderedTransitions.map((stateTransition) => (
          <li
            key={stateTransition.transition_state_id}
            className="relative flex items-center py-1.5 px-2.5 border border-custom-border-200/50 rounded bg-custom-background-90/50"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-1 text-custom-text-200">
                <span className="flex-wrap font-medium">
                  {stateTransition.approvers.length === 0
                    ? t("entity.all", { entity: t("common.members") })
                    : stateTransition.approvers
                        .map((moverId) => getUserName(moverId))
                        .filter((approverName) => !!approverName)
                        .join(", ")}
                </span>
                <span className="flex-wrap">{t("workflows.workflow_tree.state_change_label")}</span>
              </div>
              <StatePill stateId={stateTransition.transition_state_id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
