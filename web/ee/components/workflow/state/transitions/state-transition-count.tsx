import uniq from "lodash/uniq";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TStateTransitionMap } from "@plane/types";
import { ApproverIcon, WorkflowIcon } from "@plane/ui";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

type Props = {
  currentTransitionMap?: TStateTransitionMap;
};

export const StateTransitionCount = observer((props: Props) => {
  const { currentTransitionMap } = props;
  //router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const isWorkflowEnabled = useFlag(workspaceSlug.toString(), E_FEATURE_FLAGS.WORKFLOWS);
  const transitionsCount = Object.keys(currentTransitionMap ?? {}).length;
  // unique approvers
  const uniqueApproversCount = uniq(
    Object.values(currentTransitionMap ?? {}).reduce<string[]>((acc, curr) => [...acc, ...(curr.approvers ?? [])], [])
  ).length;

  if (!isWorkflowEnabled) return <></>;

  return (
    <div className="flex w-full grow items-center gap-1">
      {transitionsCount > 0 && (
        <>
          <div className="flex px-1 py-0.5 items-center">
            <WorkflowIcon className="flex-shrink-0 size-3.5 text-custom-text-300" strokeWidth={2} />
            <span className="text-xs font-medium text-custom-text-400 line-clamp-1 pl-1">
              <span className="hidden lg:block">
                {t("workflows.workflow_states.state_change_count", { count: transitionsCount })}
              </span>
              <span className="block lg:hidden">{transitionsCount}</span>
            </span>
          </div>
        </>
      )}
      {uniqueApproversCount > 0 && (
        <>
          <svg viewBox="0 0 2 2" className="flex-shrink-0 h-1 w-1 text-custom-text-300">
            <circle cx={1} cy={1} r={1} className="fill-current" />
          </svg>
          <div className="flex px-1 py-0.5 items-center">
            <ApproverIcon className="flex-shrink-0 size-3.5 text-custom-text-300" strokeWidth={2} />
            <span className="text-xs font-medium text-custom-text-400 line-clamp-1 pl-1">
              <span className="hidden lg:block">
                {t("workflows.workflow_states.movers_count", { count: uniqueApproversCount })}
              </span>
              <span className="block lg:hidden">{uniqueApproversCount}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
});
