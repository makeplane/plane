import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Button, Loader } from "@plane/ui";
// hooks
import { useEventTracker } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { ProPlanCloudUpgradeModal, PaidPlanSuccessModal } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

export const CloudEditionBadge = observer(() => {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  // states
  const [isProPlanSuccessModalOpen, setProPlanSuccessModalOpen] = useState(false);
  // hooks
  const { captureEvent } = useEventTracker();
  const {
    isProPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    toggleProPlanModal,
    fetchWorkspaceSubscribedPlan,
  } = useWorkspaceSubscription();
  // fetch workspace current plane information
  useSWR(
    workspaceSlug ? `WORKSPACE_CURRENT_PLAN_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceSubscribedPlan(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" && subscriptionDetail?.product === "PRO") {
      router.replace(pathname, {}, { showProgressBar: false });
      setProPlanSuccessModalOpen(true);
    }
  }, [pathname, router, searchParams, subscriptionDetail?.product]);

  const handleProPlanPurchaseModalOpen = () => {
    toggleProPlanModal(true);
    captureEvent("pro_plan_modal_opened", {});
  };

  const handlePaidPlanSuccessModalOpen = () => {
    setProPlanSuccessModalOpen(true);
    captureEvent("pro_plan_details_modal_opened", {});
  };

  if (!subscriptionDetail)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  // derived values
  const isInTrialPeriod =
    subscriptionDetail?.has_activated_free_trial && subscriptionDetail?.trial_end_date ? true : false;
  const isTrialCompleted =
    subscriptionDetail?.has_activated_free_trial && !subscriptionDetail?.trial_end_date ? true : false;

  const renderButtonText = () => {
    switch (subscriptionDetail.product) {
      case "FREE": {
        if (subscriptionDetail?.has_activated_free_trial) {
          return "Buy Pro";
        } else {
          return "Try Pro";
        }
      }
      case "PRO":
        if (subscriptionDetail?.has_activated_free_trial && subscriptionDetail?.has_added_payment_method) {
          return "Purchased Pro";
        } else {
          if (subscriptionDetail?.has_activated_free_trial && !subscriptionDetail?.has_added_payment_method) {
            return "Buy Pro";
          } else {
            return "Try Pro";
          }
        }
      default:
        return "Try Pro";
    }
  };

  const showPaymentButton = () => {
    switch (subscriptionDetail.product) {
      case "FREE": {
        if (subscriptionDetail?.has_activated_free_trial) {
          return true;
        } else {
          return true;
        }
      }
      case "PRO":
        if (subscriptionDetail?.has_activated_free_trial && subscriptionDetail?.has_added_payment_method) {
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
      <PaidPlanSuccessModal
        variant="PRO"
        isOpen={isProPlanSuccessModalOpen}
        handleClose={() => setProPlanSuccessModalOpen(false)}
      />

      <ProPlanCloudUpgradeModal
        isOpen={isProPlanModalOpen}
        handleClose={() => toggleProPlanModal(false)}
        yearlyPlan={false}
        handleSuccessModal={() => setProPlanSuccessModalOpen(true)}
        canFetchProducts={subscriptionDetail.product === "FREE" || isInTrialPeriod || isTrialCompleted}
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
    </>
  );
});
