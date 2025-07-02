"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { renderFormattedDate  } from "@plane/utils";
// plane web imports
import { PlanCard, SelfManagedLicenseActions } from "@/plane-web/components/license";
import { BillingActionsButton } from "@/plane-web/components/workspace/billing";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

type TBusinessPlanCardProps = {
  upgradeLoader: EProductSubscriptionEnum | null;
  handleUpgrade: (selectedSubscriptionType: EProductSubscriptionEnum) => void;
};

export const BusinessPlanCard: React.FC<TBusinessPlanCardProps> = observer((props: TBusinessPlanCardProps) => {
  const { upgradeLoader, handleUpgrade } = props;
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    isSubscriptionManagementEnabled,
    getIsInTrialPeriod,
  } = useWorkspaceSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const startDate = subscriptionDetail?.current_period_start_date;
  const endDate = subscriptionDetail?.current_period_end_date;
  const isSubscriptionCancelled = subscriptionDetail?.is_cancelled;
  const isInTrialPeriod = getIsInTrialPeriod(true);

  useEffect(() => {
    setIsLoading(upgradeLoader === EProductSubscriptionEnum.BUSINESS);
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
      planVariant={EProductSubscriptionEnum.BUSINESS}
      planDescription={
        <>
          <div>Unlimited members, 1:5 Guests, Work item types, Active Cycles, and more</div>
          {!subscriptionDetail.is_offline_payment ? (
            <>
              {isSubscriptionCancelled ? (
                <div className="text-red-500 ">Your billing cycle ends on {renderFormattedDate(endDate)}.</div>
              ) : (
                <div>
                  {startDate
                    ? `Current billing cycle: ${renderFormattedDate(startDate)} - ${renderFormattedDate(endDate)}`
                    : `Your billing cycle renews on ${renderFormattedDate(endDate)}`}{" "}
                  • Billable seats: {subscriptionDetail?.billable_members}
                </div>
              )}
            </>
          ) : (
            <div>
              To manage your subscription, please{" "}
              <a className="text-custom-primary-300 hover:underline" href="mailto:support@plane.so">
                contact support.
              </a>
            </div>
          )}
          <SelfManagedLicenseActions />
        </>
      }
      button={
        isSubscriptionManagementEnabled && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="link-neutral"
              className="cursor-pointer px-3 py-1.5 text-center text-xs font-medium outline-none"
              onClick={
                !isSelfManaged && isInTrialPeriod
                  ? () => handleUpgrade(EProductSubscriptionEnum.BUSINESS)
                  : handleSubscriptionPageRedirection
              }
              disabled={isLoading}
            >
              {isLoading ? "Redirecting to Stripe" : "Manage subscription"}
              <ExternalLink className="h-3 w-3" strokeWidth={2} />
            </Button>
            <BillingActionsButton canPerformWorkspaceAdminActions />
          </div>
        )
      }
    />
  );
});
