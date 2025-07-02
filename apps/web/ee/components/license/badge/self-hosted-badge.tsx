"use client";

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import { PlaneIcon } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// plane web imports
import { SubscriptionButton } from "@/plane-web/components/common";
import { PlaneOneEditionBadge } from "@/plane-web/components/license";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const SelfHostedEditionBadge = observer(() => {
  // hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    togglePaidPlanModal,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  const { t } = useTranslation();

  if (!subscriptionDetail || subscriptionDetail.product === EProductSubscriptionEnum.FREE)
    return (
      <>
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
