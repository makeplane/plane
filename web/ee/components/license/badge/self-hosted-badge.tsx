"use client";

import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlaneIcon } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// plane web imports
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

  if (!subscriptionDetail || subscriptionDetail.product === EProductSubscriptionEnum.FREE)
    return (
      <>
        <SubscriptionActivationModal
          isOpen={isActivationModalOpen}
          handleClose={() => toggleLicenseActivationModal(false)}
        />
        <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
        <SubscriptionButton
          subscriptionType={subscriptionDetail?.product ?? EProductSubscriptionEnum.FREE}
          handleClick={() => togglePaidPlanModal(true)}
          className="min-w-24"
        >
          {t("sidebar.upgrade_plan")}
        </SubscriptionButton>
      </>
    );

  if (subscriptionDetail.product === EProductSubscriptionEnum.ONE) {
    return <PlaneOneEditionBadge />;
  }

  return (
    <SubscriptionButton
      subscriptionType={subscriptionDetail.product}
      handleClick={() => handleSuccessModalToggle(true)}
    >
      <PlaneIcon className={cn("size-3")} />
      {getSubscriptionName(subscriptionDetail.product)}
    </SubscriptionButton>
  );
});
