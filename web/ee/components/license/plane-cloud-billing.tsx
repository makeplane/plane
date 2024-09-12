import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// store hooks
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// services
import { PaymentService } from "@/plane-web/services/payment.service";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

const paymentService = new PaymentService();

export const PlaneCloudBilling: React.FC = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const endDate = subscriptionDetail?.current_period_end_date;
  const isSubscriptionCancelled = subscriptionDetail?.is_cancelled;
  const isInTrialPeriod = subscriptionDetail?.is_on_trial && !subscriptionDetail?.has_upgraded;

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
          message: "Failed to redirect to subscription page. Please try again.",
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
          <div className="flex gap-2 font-medium justify-between">
            <div className="flex items-center gap-2">
              <Image src={PlaneLogo} alt="Plane" width={24} height={24} />
              <h4 className="text-xl mb-1 leading-6 font-bold">Free plan</h4>
            </div>
            <div>
              <Button
                tabIndex={-1}
                variant="accent-primary"
                className="w-full cursor-pointer rounded-2xl px-4 py-1.5 text-center text-sm font-medium outline-none"
                onClick={() => togglePaidPlanModal(true)}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      )}
      {subscriptionDetail.product === "PRO" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 text-lg font-medium justify-between">
            <div className="flex items-center gap-2">
              <Image src={PlaneLogo} alt="Plane pro" width={24} height={24} />
              <h4 className="text-2xl mb-1 leading-6 font-bold">Plane Pro</h4>
              {!subscriptionDetail.is_offline_payment && (
                <>
                  {isInTrialPeriod && (
                    <>
                      <div className="flex-shrink-0 p-1 px-2 bg-custom-primary-100/20 text-custom-primary-100 text-xs rounded-full font-medium">
                        Pro Trial
                      </div>
                      <div className="text-center text-sm text-custom-text-200 font-medium">
                        (Pro trial ends on: {renderFormattedDate(subscriptionDetail.trial_end_date)})
                      </div>
                    </>
                  )}
                  {!isInTrialPeriod &&
                    (isSubscriptionCancelled ? (
                      <div className="text-center text-sm text-red-500 font-medium">
                        (Expires on: {renderFormattedDate(endDate)})
                      </div>
                    ) : (
                      <div className="text-center text-sm text-custom-text-200 font-medium">
                        (Renew on: {renderFormattedDate(endDate)})
                      </div>
                    ))}
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
