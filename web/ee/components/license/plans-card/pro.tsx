"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// store hooks
import { renderFormattedDate } from "@/helpers/date-time.helper";
// plane web components
import { PlanCard } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// services
import { PaymentService } from "@/plane-web/services/payment.service";
import { cn } from "@/helpers/common.helper";

const paymentService = new PaymentService();

type TProPlanCardProps = {
  upgradeLoader: boolean;
  handleUpgrade: () => void;
};

export const ProPlanCard: React.FC<TProPlanCardProps> = observer((props: TProPlanCardProps) => {
  const { upgradeLoader, handleUpgrade } = props;
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const startDate = subscriptionDetail?.current_period_start_date;
  const endDate = subscriptionDetail?.current_period_end_date;
  const isSubscriptionCancelled = subscriptionDetail?.is_cancelled;
  const isInTrialPeriod = !isSelfManaged && subscriptionDetail?.is_on_trial && !subscriptionDetail?.has_upgraded;

  useEffect(() => {
    setIsLoading(upgradeLoader);
  }, [upgradeLoader]);

  const handleSubscriptionPageRedirection = () => {
    setIsLoading(true);
    paymentService
      .getWorkspaceSubscriptionPageLink(workspaceSlug.toString())
      .then((response) => {
        if (response.url) {
          window.open(response.url, "_blank");
        }
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to redirect to subscription page. Please try again.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!subscriptionDetail) return null;

  return (
    <PlanCard
      planName={isInTrialPeriod ? "Pro trial" : "Pro"}
      planDescription={
        !subscriptionDetail.is_offline_payment && (
          <>
            <div>Unlimited members, 1 : 5 Guests, Issue Types, Active Cycles, and more</div>
            {isInTrialPeriod && (
              <div className={cn("text-custom-text-300", subscriptionDetail.show_trial_banner && "text-red-500")}>
                Pro trial ends{" "}
                {subscriptionDetail.remaining_trial_days === 0
                  ? "today"
                  : `in ${subscriptionDetail.remaining_trial_days} days`}
              </div>
            )}
            {!isInTrialPeriod &&
              (isSubscriptionCancelled ? (
                <div className="text-red-500 ">Your billing cycle ends on {renderFormattedDate(endDate)}.</div>
              ) : (
                <div>
                  {startDate
                    ? `Current billing cycle: ${renderFormattedDate(startDate)} - ${renderFormattedDate(endDate)}`
                    : `Your billing cycle renews on ${renderFormattedDate(endDate)}.`}
                </div>
              ))}
          </>
        )
      }
      button={
        !subscriptionDetail.is_offline_payment && (
          <Button
            variant="primary"
            className="cursor-pointer px-3 py-1.5 text-center text-sm font-medium outline-none"
            onClick={!isSelfManaged && isInTrialPeriod ? handleUpgrade : handleSubscriptionPageRedirection}
            disabled={isLoading}
          >
            {isLoading ? "Redirecting to Stripe..." : isInTrialPeriod ? "Upgrade to Pro" : "Manage your subscription"}
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </Button>
        )
      }
    />
  );
});
