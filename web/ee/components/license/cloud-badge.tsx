import { useEffect } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
// ui
import { Button } from "@plane/ui";
// hooks
import { useEventTracker } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { ProPlanCloudUpgradeModal } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

export const CloudEditionBadge = observer(() => {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // hooks
  const { captureEvent } = useEventTracker();
  const {
    isProPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    toggleProPlanModal,
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
    toggleProPlanModal(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handlePaidPlanSuccessModalOpen = () => {
    handleSuccessModalToggle(true);
    captureEvent("pro_plan_details_modal_opened", {});
  };

  if (!subscriptionDetail) return null;

  const renderButtonText = () => {
    if (!subscriptionDetail.subscription) {
      return "Upgrade to Pro";
    }
    switch (subscriptionDetail.product) {
      case "FREE": {
        if (subscriptionDetail?.has_activated_free_trial) {
          return "Buy Pro";
        } else {
          return "Upgrade to Pro";
        }
      }
      case "PRO":
        if (subscriptionDetail?.has_activated_free_trial && subscriptionDetail?.has_added_payment_method) {
          return "Purchased Pro";
        } else {
          if (subscriptionDetail?.has_activated_free_trial && !subscriptionDetail?.has_added_payment_method) {
            return "Buy Pro";
          } else {
            return "Upgrade to Pro";
          }
        }
      default:
        return "Upgrade to Pro";
    }
  };

  const showPaymentButton = () => {
    if (!subscriptionDetail.subscription) {
      return true;
    }
    switch (subscriptionDetail.product) {
      case "FREE": {
        return true;
      }
      case "PRO":
        if (subscriptionDetail.is_offline_payment) {
          return false;
        } else if (subscriptionDetail?.has_activated_free_trial && subscriptionDetail?.has_added_payment_method) {
          return false;
        } else {
          if (subscriptionDetail?.has_activated_free_trial && !subscriptionDetail?.has_added_payment_method) {
            return true;
          } else {
            return false;
          }
        }
      default:
        return false;
    }
  };

  const showPlaneProButton = showPaymentButton() ? false : subscriptionDetail.product === "PRO" ? true : false;

  return (
    <>
      <ProPlanCloudUpgradeModal
        isOpen={isProPlanModalOpen}
        handleClose={() => toggleProPlanModal(false)}
        yearlyPlan={false}
        handleSuccessModal={() => handleSuccessModalToggle(true)}
      />

      {showPaymentButton() && (
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-full cursor-pointer rounded-2xl px-4 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handleProPlanPurchaseModalOpen}
        >
          {renderButtonText()}
        </Button>
      )}

      {showPlaneProButton && (
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-full cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
          onClick={handlePaidPlanSuccessModalOpen}
        >
          <Image src={PlaneLogo} alt="Plane Pro" width={14} height={14} />
          Plane Pro
        </Button>
      )}

      {/* Fallback text */}
      {!showPaymentButton() && !showPlaneProButton && (
        <div className="w-full cursor-default rounded-md bg-green-500/10 px-2 py-1 text-center text-xs font-medium text-green-500 outline-none leading-6">
          Enterprise Edition
        </div>
      )}
    </>
  );
});
