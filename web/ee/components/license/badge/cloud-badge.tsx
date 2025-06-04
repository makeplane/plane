"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { PlaneIcon } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// hooks
import { useEventTracker } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { SubscriptionButton } from "@/plane-web/components/common";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const CloudEditionBadge = observer(() => {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // hooks
  const { captureEvent } = useEventTracker();
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    togglePaidPlanModal,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  // derived values
  const currentSubscription = subscriptionDetail?.product;
  const remainingTrialDays = subscriptionDetail?.remaining_trial_days;
  const showPaymentButton = !!subscriptionDetail?.show_payment_button;
  const isOnTrial = !!subscriptionDetail?.is_on_trial;

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" && currentSubscription === EProductSubscriptionEnum.PRO) {
      router.replace(pathname, {}, { showProgressBar: false });
      handleSuccessModalToggle(true);
    }
  }, [pathname, router, searchParams, currentSubscription, handleSuccessModalToggle]);

  const handleProPlanPurchaseModalOpen = () => {
    togglePaidPlanModal(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handlePaidPlanSuccessModalOpen = () => {
    handleSuccessModalToggle(true);
    captureEvent("pro_plan_details_modal_opened", {});
  };

  const renderButtonText = () => {
    switch (currentSubscription) {
      case EProductSubscriptionEnum.FREE:
        return "Upgrade plan";
      case EProductSubscriptionEnum.PRO:
      case EProductSubscriptionEnum.BUSINESS:
      case EProductSubscriptionEnum.ENTERPRISE:
        return `${getSubscriptionName(currentSubscription)} trial ends
            ${remainingTrialDays === 0 ? "today" : `in ${remainingTrialDays}d`}
            `;
      default:
        return "Upgrade";
    }
  };

  if (!subscriptionDetail || !currentSubscription) return null;
  return (
    <>
      {showPaymentButton && (
        <SubscriptionButton
          className="min-w-24"
          subscriptionType={currentSubscription}
          handleClick={handleProPlanPurchaseModalOpen}
        >
          {renderButtonText()}
        </SubscriptionButton>
      )}
      {!showPaymentButton && (
        <SubscriptionButton subscriptionType={currentSubscription} handleClick={handlePaidPlanSuccessModalOpen}>
          {isOnTrial ? (
            `${getSubscriptionName(currentSubscription)} trial ends
            ${remainingTrialDays === 0 ? "today" : `in ${remainingTrialDays}d`}
            `
          ) : (
            <>
              <PlaneIcon className={cn("size-3")} />
              {getSubscriptionName(currentSubscription)}
            </>
          )}
        </SubscriptionButton>
      )}
    </>
  );
});
