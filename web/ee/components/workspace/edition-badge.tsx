import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader, PlaneIcon } from "@plane/ui";
// plane web imports
import { cn } from "@plane/utils";
import { SubscriptionButton } from "@/plane-web/components/common";
import {
  CloudEditionBadge,
  PaidPlanSuccessModal,
  BusinessPlanSuccessModal,
  SelfHostedEditionBadge,
} from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const WorkspaceEditionBadge = observer(() => {
  // hooks
  const {
    isSuccessPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  const { t } = useTranslation();

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
          <SubscriptionButton
            subscriptionType={EProductSubscriptionEnum.BUSINESS}
            handleClick={() => handleSuccessModalToggle(true)}
          >
            <PlaneIcon className={cn("size-3")} />
            <div>{t("sidebar.business")}</div>
          </SubscriptionButton>
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
