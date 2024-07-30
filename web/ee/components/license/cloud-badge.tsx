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

  return (
    <>
      <PaidPlanSuccessModal
        variant="PRO"
        isOpen={isProPlanSuccessModalOpen}
        handleClose={() => setProPlanSuccessModalOpen(false)}
      />
      {(subscriptionDetail.product === "FREE" ||
        (subscriptionDetail.product === "PRO" && subscriptionDetail.interval === "month")) && (
        <>
          {/* This modal is intentionally placed inside the condition to avoid unnecessary calls to list product endpoint.  */}
          <ProPlanCloudUpgradeModal
            isOpen={isProPlanModalOpen}
            handleClose={() => toggleProPlanModal(false)}
            yearlyPlan={subscriptionDetail.product === "PRO"}
          />
          <Button
            tabIndex={-1}
            variant="accent-primary"
            className="w-full cursor-pointer rounded-2xl px-4 py-1.5 text-center text-sm font-medium outline-none"
            onClick={handleProPlanPurchaseModalOpen}
          >
            {subscriptionDetail.product === "FREE" ? "Upgrade to Pro" : "Get Pro yearly"}
          </Button>
        </>
      )}
      {subscriptionDetail.product === "PRO" && subscriptionDetail.interval === "year" && (
        <>
          <Button
            tabIndex={-1}
            variant="accent-primary"
            className="w-full cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
            onClick={handlePaidPlanSuccessModalOpen}
          >
            <Image src={PlaneLogo} alt="Plane Pro" width={14} height={14} />
            {"Plane Pro"}
          </Button>
        </>
      )}
    </>
  );
});
