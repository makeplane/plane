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
    switch (subscriptionDetail.product) {
      case "FREE":
        return "Upgrade to Pro";
      case "PRO":
        return `Pro trial ends ${subscriptionDetail.remaining_trial_days}d`;
      default:
        return "Upgrade";
    }
  };

  return (
    <>
      <ProPlanCloudUpgradeModal
        isOpen={isProPlanModalOpen}
        handleClose={() => toggleProPlanModal(false)}
        handleSuccessModal={() => handleSuccessModalToggle(true)}
      />

      {subscriptionDetail.show_payment_button && (
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-fit min-w-24 cursor-pointer rounded-2xl px-4 py-1 text-center text-sm font-medium outline-none"
          onClick={handleProPlanPurchaseModalOpen}
        >
          {renderButtonText()}
        </Button>
      )}

      {!subscriptionDetail.show_payment_button && (
        <Button
          tabIndex={-1}
          variant="accent-primary"
          className="w-fit cursor-pointer rounded-2xl px-4 py-1 text-center text-sm font-medium outline-none"
          onClick={handlePaidPlanSuccessModalOpen}
        >
          <Image src={PlaneLogo} alt="Plane Pro" width={14} height={14} />
          Plane Pro
        </Button>
      )}
    </>
  );
});
