import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
// ui
import { Button, Loader, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
// store hooks
import { cn } from "@/helpers/common.helper";
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
  const { currentWorkspaceSubscribedPlanDetail, toggleProPlanModal } = useWorkspaceSubscription();
  // derived values
  const endDate = currentWorkspaceSubscribedPlanDetail?.current_period_end_date;
  const isSubscriptionCancelled = currentWorkspaceSubscribedPlanDetail?.is_cancelled;
  const isInTrialPeriod =
    currentWorkspaceSubscribedPlanDetail?.is_on_trial && !currentWorkspaceSubscribedPlanDetail.has_upgraded;

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
        {!currentWorkspaceSubscribedPlanDetail && (
          <Loader className="flex w-full justify-between">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="30px" width="20%" />
          </Loader>
        )}
        {currentWorkspaceSubscribedPlanDetail?.product === "FREE" && (
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
                  onClick={() => toggleProPlanModal(true)}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>
        )}
        {currentWorkspaceSubscribedPlanDetail?.product === "PRO" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 text-lg font-medium justify-between">
              <div className="flex items-center gap-2">
                <Image src={PlaneLogo} alt="Plane pro" width={24} height={24} />
                <h4 className="text-2xl mb-1 leading-6 font-bold">Plane Pro</h4>
                {!currentWorkspaceSubscribedPlanDetail.is_offline_payment && (
                  <>
                    {isInTrialPeriod && (
                      <>
                        <div className="flex-shrink-0 p-1 px-2 bg-custom-primary-100/20 text-custom-primary-100 text-xs rounded-full font-medium">
                          Pro Trial
                        </div>
                        <div className="text-center text-sm text-custom-text-200 font-medium">
                          (Pro trial ends on:{" "}
                          {renderFormattedDate(currentWorkspaceSubscribedPlanDetail?.trial_end_date)})
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
              {!currentWorkspaceSubscribedPlanDetail.is_offline_payment && (
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
      </div>
    </section>
  );
});
