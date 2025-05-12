import { observer } from "mobx-react";
// plane imports
import { Loader } from "@plane/ui";
// plane web imports
import { CloudEditionBadge, PaidPlanSuccessModal, SelfHostedEditionBadge } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const WorkspaceEditionBadge = observer(() => {
  // hooks
  const {
    isSuccessPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  // derived values
  const isSelfHosted = subscriptionDetail?.is_self_managed;

  if (!subscriptionDetail)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  return (
    <>
      <PaidPlanSuccessModal
        variant={subscriptionDetail.product}
        isOpen={isSuccessPlanModalOpen}
        handleClose={() => handleSuccessModalToggle(false)}
      />
      {isSelfHosted ? <SelfHostedEditionBadge /> : <CloudEditionBadge />}
    </>
  );
});
