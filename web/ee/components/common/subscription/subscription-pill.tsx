// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { IWorkspace } from "@plane/types";
import { cn, getSubscriptionName } from "@plane/utils";
import { getSubscriptionTextAndBackgroundColor } from "@/components/workspace/billing/subscription";

type TProps = { workspace: IWorkspace };

export const SubscriptionPill = (props: TProps) => {
  const { workspace } = props;
  // derived values
  const subscriptionName = getSubscriptionName(workspace.current_plan ?? EProductSubscriptionEnum.FREE);
  const subscriptionColor = getSubscriptionTextAndBackgroundColor(
    workspace.current_plan ?? EProductSubscriptionEnum.FREE
  );
  const isOnTrial = workspace.is_on_trial;

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
};
