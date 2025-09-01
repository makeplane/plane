import { observer } from "mobx-react";
// plane imports
import { Loader } from "@plane/ui";
// plane web imports
// import { CloudEditionBadge, SelfHostedEditionBadge } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/use-workspace-subscription";

export const WorkspaceEditionBadge = observer(() => {
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfHosted = subscriptionDetail?.is_self_managed;

  if (!subscriptionDetail)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  // return <>{isSelfHosted ? <SelfHostedEditionBadge /> : <CloudEditionBadge />}</>;
});
