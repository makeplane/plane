import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// plane web components
import { CloudEditionBadge, PaidPlanSuccessModal, SelfManagedEditionBadge } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const WorkspaceEditionBadge = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // hooks
  const {
    isSuccessPlanModalOpen,
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    handleSuccessModalToggle,
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

  if (!subscriptionDetail)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  return (
    <>
      {["PRO", "ONE"].includes(subscriptionDetail.product) && (
        <PaidPlanSuccessModal
          variant={subscriptionDetail.product as "PRO" | "ONE"}
          isOpen={isSuccessPlanModalOpen}
          handleClose={() => handleSuccessModalToggle(false)}
        />
      )}
      {subscriptionDetail.is_self_managed ? <SelfManagedEditionBadge /> : <CloudEditionBadge />}
    </>
  );
});
