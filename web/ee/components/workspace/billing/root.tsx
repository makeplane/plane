import { observer } from "mobx-react";
import { ExternalLink } from "lucide-react";
import { getButtonStyling, Loader } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { PlaneCloudBilling, PlaneSelfHostedBilling } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const BillingRoot = observer(() => {
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  return (
    <section className="w-full overflow-y-auto md:pr-9 pr-4">
      <div>
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium flex gap-4">
            Billing and plans{" "}
            <a
              href="https://plane.so/pricing"
              className={cn(
                getButtonStyling("neutral-primary", "sm"),
                "cursor-pointer rounded-2xl px-3 py-1 text-center text-xs font-medium outline-none"
              )}
              target="_blank"
              rel="noreferrer noopener"
            >
              {"View all plans"}
              <ExternalLink className="h-3 w-3" strokeWidth={2} />
            </a>
          </h3>
        </div>
      </div>
      <div className="py-6">
        {!subscriptionDetail ? (
          <Loader className="flex w-full justify-between">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="30px" width="20%" />
          </Loader>
        ) : !subscriptionDetail.is_self_managed ? (
          <PlaneCloudBilling />
        ) : (
          <PlaneSelfHostedBilling />
        )}
      </div>
    </section>
  );
});
