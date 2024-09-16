import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
// ui
import { Button, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
// store hooks
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// services
import { PaymentService } from "@/plane-web/services/payment.service";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";
import { PlaneOneBilling } from "./plane-one-billing";

const paymentService = new PaymentService();

export const PlaneSelfHostedBilling: React.FC = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const endDate = subscriptionDetail?.current_period_end_date;
  const isSubscriptionCancelled = subscriptionDetail?.is_cancelled;

  const handleSubscriptionPageRedirection = () => {
    setIsLoading(true);
    paymentService
      .getWorkspaceSubscriptionPageLink(workspaceSlug.toString())
      .then((response) => {
        if (response.url) {
          window.open(response.url, "_blank");
        }
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message:
            "Failed to redirect to subscription page. Please make sure you're connected to the internet and try again.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!subscriptionDetail) return null;

  return (
    <>
      {subscriptionDetail.product === "FREE" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                <Image src={PlaneLogo} alt="Plane" width={20} height={20} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xl leading-6 font-semibold">Free</h4>
                  <span className="px-2 py-0.5 bg-green-600/10 text-green-700 text-xs font-medium rounded">
                    Current plan
                  </span>
                </div>
                <div className="text-sm text-custom-text-200">
                  Your Plane license can only be used to unlock features for one workspace.
                </div>
              </div>
            </div>
            <div>
              <Link
                href={`/${workspaceSlug?.toString()}/settings/activation`}
                className={cn(getButtonStyling("primary", "md"), "cursor-pointer outline-none")}
              >
                Activate this workspace
              </Link>
            </div>
          </div>
        </div>
      )}
      {subscriptionDetail.product === "ONE" && <PlaneOneBilling />}
      {subscriptionDetail.product === "PRO" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 text-lg font-medium justify-between">
            <div className="flex items-center gap-2">
              <Image src={PlaneLogo} alt="Plane pro" width={24} height={24} />
              <h4 className="text-2xl mb-1 leading-6 font-bold">Plane Pro</h4>
              {!subscriptionDetail.is_offline_payment && (
                <>
                  {isSubscriptionCancelled ? (
                    <div className="text-center text-sm text-red-500 font-medium">
                      (Expires on: {renderFormattedDate(endDate)})
                    </div>
                  ) : (
                    <div className="text-center text-sm text-custom-text-200 font-medium">
                      (Renew on: {renderFormattedDate(endDate)})
                    </div>
                  )}
                </>
              )}
            </div>
            {!subscriptionDetail.is_offline_payment && (
              <div>
                <Button
                  variant="neutral-primary"
                  className="cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
                  onClick={handleSubscriptionPageRedirection}
                >
                  {isLoading ? "Redirecting to Stripe..." : "Manage your subscriptions"}
                  <ExternalLink className="h-3 w-3" strokeWidth={2} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});
