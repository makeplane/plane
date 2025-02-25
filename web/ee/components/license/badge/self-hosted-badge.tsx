"use client";

import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane web imports
import { PlaneIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { SubscriptionButton } from "@/plane-web/components/common";
import { PaidPlanUpgradeModal, PlaneOneEditionBadge } from "@/plane-web/components/license";
import { SubscriptionActivationModal } from "@/plane-web/components/workspace";
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const SelfHostedEditionBadge = observer(() => {
  // hooks
  const {
    isPaidPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    togglePaidPlanModal,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  const { isActivationModalOpen, toggleLicenseActivationModal } = useSelfHostedSubscription();
  const { t } = useTranslation();

  if (!subscriptionDetail || subscriptionDetail.product === "FREE")
    return (
      <>
        <SubscriptionActivationModal
          isOpen={isActivationModalOpen}
          handleClose={() => toggleLicenseActivationModal(false)}
        />
        <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
        <SubscriptionButton
          subscriptionType={EProductSubscriptionEnum.PRO}
          handleClick={() => togglePaidPlanModal(true)}
          className="min-w-24"
        >
          {t("sidebar.upgrade_plan")}
        </SubscriptionButton>
      </>
    );

  if (subscriptionDetail.product === "ONE") {
    return <PlaneOneEditionBadge />;
  }

  if (subscriptionDetail.product === "PRO") {
    return (
      <>
        <SubscriptionButton
          subscriptionType={EProductSubscriptionEnum.PRO}
          handleClick={() => handleSuccessModalToggle(true)}
        >
          <PlaneIcon className={cn("size-3")} />
          Pro
        </SubscriptionButton>
      </>
    );
  }
});
