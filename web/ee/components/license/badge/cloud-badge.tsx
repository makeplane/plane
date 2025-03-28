"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { PlaneIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useEventTracker } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { SubscriptionButton } from "@/plane-web/components/common";
import { PaidPlanUpgradeModal } from "@/plane-web/components/license";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const CloudEditionBadge = observer(() => {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // hooks
  const { captureEvent } = useEventTracker();
  const {
    isPaidPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    togglePaidPlanModal,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" && subscriptionDetail?.product === "PRO") {
      router.replace(pathname, {}, { showProgressBar: false });
      handleSuccessModalToggle(true);
    }
  }, [pathname, router, searchParams, subscriptionDetail?.product, handleSuccessModalToggle]);

  const handleProPlanPurchaseModalOpen = () => {
    togglePaidPlanModal(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handlePaidPlanSuccessModalOpen = () => {
    handleSuccessModalToggle(true);
    captureEvent("pro_plan_details_modal_opened", {});
  };

  if (!subscriptionDetail) return null;

  const renderButtonText = () => {
    switch (subscriptionDetail.product) {
      case "FREE":
        return "Upgrade plan";
      case "PRO":
        return `Pro trial ends
            ${
              subscriptionDetail.remaining_trial_days === 0 ? "today" : `in ${subscriptionDetail.remaining_trial_days}d`
            }
            `;
      default:
        return "Upgrade";
    }
  };

  return (
    <>
      <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
      {subscriptionDetail.show_payment_button && (
        <SubscriptionButton
          className="min-w-24"
          subscriptionType={EProductSubscriptionEnum.PRO}
          handleClick={handleProPlanPurchaseModalOpen}
        >
          {renderButtonText()}
        </SubscriptionButton>
      )}

      {!subscriptionDetail.show_payment_button && (
        <SubscriptionButton
          subscriptionType={EProductSubscriptionEnum.PRO}
          handleClick={handlePaidPlanSuccessModalOpen}
        >
          {subscriptionDetail.is_on_trial ? (
            `Pro trial ends
            ${
              subscriptionDetail.remaining_trial_days === 0 ? "today" : `in ${subscriptionDetail.remaining_trial_days}d`
            }
            `
          ) : (
            <>
              <PlaneIcon className={cn("size-3")} />
              Pro
            </>
          )}
        </SubscriptionButton>
      )}
    </>
  );
});
