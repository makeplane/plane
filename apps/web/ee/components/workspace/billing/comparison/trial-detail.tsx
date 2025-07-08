import { FC } from "react";
import { observer } from "mobx-react";
import { LoaderIcon } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { Button } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TTrialDetailsProps = {
  subscriptionType: EProductSubscriptionEnum;
  trialLoader: EProductSubscriptionEnum | null;
  upgradeLoader: EProductSubscriptionEnum | null;
  isProductsAPILoading: boolean;
  handleTrial: (subscriptionType: EProductSubscriptionEnum) => void;
};

export const TrialDetails: FC<TTrialDetailsProps> = observer((props) => {
  const { subscriptionType, trialLoader, upgradeLoader, isProductsAPILoading, handleTrial } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const planName = getSubscriptionName(subscriptionType);
  const currentSubscription = subscriptionDetail?.product;
  const isSelfManaged = !!subscriptionDetail?.is_self_managed;
  const isOfflinePayment = !!subscriptionDetail?.is_offline_payment;
  const isTrialAllowed = !!subscriptionDetail?.is_trial_allowed;
  const isOnTrialPeriod = getIsInTrialPeriod(false) && currentSubscription === subscriptionType;
  const isTrialEnded = !!subscriptionDetail?.is_trial_ended && currentSubscription === subscriptionType;

  if (isSelfManaged || isOfflinePayment) return null;
  if (!subscriptionDetail || isProductsAPILoading) return null;

  if (isTrialAllowed) {
    return (
      <Button
        variant="link-neutral"
        size="sm"
        onClick={() => handleTrial(subscriptionType)}
        className="w-full -ml-3"
        disabled={!!trialLoader || !!upgradeLoader}
      >
        <div className="w-3 h-3">
          {trialLoader === subscriptionType && <LoaderIcon size={12} className="animate-spin" />}
        </div>
        <span>Start free trial</span>
      </Button>
    );
  }

  if (isOnTrialPeriod && subscriptionDetail) {
    return (
      <span
        className={cn("w-full py-1 text-center text-custom-text-300 text-xs", {
          "text-red-500": subscriptionDetail.show_trial_banner,
        })}
      >
        {planName} trial ends{" "}
        {subscriptionDetail.remaining_trial_days === 0 ? "today" : `in ${subscriptionDetail.remaining_trial_days} days`}
      </span>
    );
  }

  if (isTrialEnded) {
    return <div className="w-full px-2 py-1 text-center text-xs text-red-500 font-medium">{planName} trial ended</div>;
  }

  return null;
});
