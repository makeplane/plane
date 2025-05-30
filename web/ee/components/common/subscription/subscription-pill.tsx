// plane imports
import { observer } from "mobx-react";
import { EProductSubscriptionEnum } from "@plane/constants";
import { IWorkspace } from "@plane/types";
import { cn, getSubscriptionName } from "@plane/utils";
import { getSubscriptionTextAndBackgroundColor } from "@/components/workspace/billing/subscription";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

// In case workspace is not passed, we will use the current workspace's subscription detail from the store
type TProps = { workspace?: IWorkspace };

export const SubscriptionPill = observer((props: TProps) => {
  const { workspace } = props;
  //hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const subscriptionName = getSubscriptionName(
    workspace?.current_plan ?? subscriptionDetail?.product ?? EProductSubscriptionEnum.FREE
  );
  const subscriptionColor = getSubscriptionTextAndBackgroundColor(
    workspace?.current_plan ?? subscriptionDetail?.product ?? EProductSubscriptionEnum.FREE
  );
  const isOnTrial = workspace ? workspace?.is_on_trial : subscriptionDetail?.is_on_trial;

  return (
    <div
      className={cn(
        "rounded bg-custom-background-80 px-2 py-[1px] text-xs font-medium text-custom-text-300",
        subscriptionColor
      )}
    >
      <h1>
        {subscriptionName}
        {isOnTrial && " trial"}
      </h1>
    </div>
  );
});
