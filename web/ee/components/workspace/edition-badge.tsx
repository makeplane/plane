import { observer } from "mobx-react";
import Image from "next/image";
// ui
import { Loader } from "@plane/ui";
// plane web components
import {
  CloudEditionBadge,
  PaidPlanSuccessModal,
  BusinessPlanSuccessModal,
  SelfHostedEditionBadge,
} from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneBusinessLogo from "@/public/plane-logos/plane-business-logo.svg";

export const WorkspaceEditionBadge = observer(() => {
  // hooks
  const {
    isSuccessPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();

  if (!subscriptionDetail)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  return (
    <>
      {subscriptionDetail.product === "BUSINESS" ? (
        <>
          <BusinessPlanSuccessModal
            isOpen={isSuccessPlanModalOpen}
            handleClose={() => handleSuccessModalToggle(false)}
          />
          <div
            className="w-fit relative flex items-center gap-x-1.5 bg-purple-900/30 text-purple-600 rounded-2xl px-4 py-1 text-sm cursor-pointer"
            onClick={() => handleSuccessModalToggle(true)}
          >
            <Image src={PlaneBusinessLogo} width={12} alt="Plane business badge" />
            <div>Business</div>
          </div>
        </>
      ) : (
        <>
          {["PRO", "ONE"].includes(subscriptionDetail.product) && (
            <PaidPlanSuccessModal
              variant={subscriptionDetail.product as "PRO" | "ONE"}
              isOpen={isSuccessPlanModalOpen}
              handleClose={() => handleSuccessModalToggle(false)}
            />
          )}
          {subscriptionDetail.is_self_managed ? <SelfHostedEditionBadge /> : <CloudEditionBadge />}
        </>
      )}
    </>
  );
});
