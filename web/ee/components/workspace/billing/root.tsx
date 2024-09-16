import { useState } from "react";
import { useParams } from "next/navigation";
import { observer } from "mobx-react";
import useSWR from "swr";
import orderBy from "lodash/orderBy";
// ui
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// types
import { IPaymentProduct } from "@plane/types";
// plane web components
import { PlansComparison } from "@/plane-web/components/workspace/billing";
import { CloudFreePlanCard, OnePlanCard, ProPlanCard, SelfHostedFreePlanCard } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web services
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

export const BillingRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // states
  const [selectedFrequency, setSelectedFrequency] = useState<"month" | "year">("year");
  const [upgradeLoader, setUpgradeLoader] = useState(false);
  const [trialLoader, setTrialLoader] = useState(false);
  // store hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    freeTrialSubscription,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  // fetch products
  const isCloudInstance = subscriptionDetail?.is_self_managed === false;
  const { isLoading: isProductsAPILoading, data } = useSWR(
    workspaceSlug ? `CLOUD_PAYMENT_PRODUCTS_${workspaceSlug?.toString()}_${isCloudInstance}` : null,
    workspaceSlug && isCloudInstance ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const proProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "PRO");
  const monthlyPrice = orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "month"
  );
  const yearlyPrice = orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "year"
  );
  // env
  const PRO_PLAN_MONTHLY_PAYMENT_URL = "https://app.plane.so/upgrade/pro/self-hosted?plan=month";
  const PRO_PLAN_YEARLY_PAYMENT_URL = "https://app.plane.so/upgrade/pro/self-hosted?plan=year";

  // handlers
  const handleTrial = async () => {
    if (isSelfManaged) return;
    const selectedPriceId = selectedFrequency === "year" ? yearlyPrice?.id : monthlyPrice?.id;
    if (!proProduct || !selectedFrequency || !selectedPriceId) return;
    try {
      setTrialLoader(true);
      if (!workspaceSlug) return;
      await freeTrialSubscription(workspaceSlug.toString(), { product_id: proProduct?.id, price_id: selectedPriceId });
      handleSuccessModalToggle(true);
    } catch (error) {
      const currentError = error as unknown as { error: string; detail: string };
      console.error("Error in freeTrialSubscription", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: currentError?.detail ?? currentError?.error ?? "Something went wrong. Please try again.",
      });
    } finally {
      setTrialLoader(false);
    }
  };

  const handleStripeCheckout = () => {
    // if the user is self-managed then open the payment link from env
    if (isSelfManaged) {
      setUpgradeLoader(true);
      if (selectedFrequency === "month") {
        window.open(PRO_PLAN_MONTHLY_PAYMENT_URL, "_blank");
      } else if (selectedFrequency === "year") {
        window.open(PRO_PLAN_YEARLY_PAYMENT_URL, "_blank");
      } else {
        window.open(PRO_PLAN_YEARLY_PAYMENT_URL, "_blank");
      }
      setUpgradeLoader(false);
      return;
    }

    // if the user is on cloud, then redirect to the payment link from the payment server
    const selectedPriceId = selectedFrequency === "year" ? yearlyPrice?.id : monthlyPrice?.id;
    if (!proProduct || !selectedPriceId) return;
    setUpgradeLoader(true);
    paymentService
      .getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
        price_id: selectedPriceId,
        product_id: proProduct?.id,
      })
      .then((response) => {
        if (response.url) {
          window.open(response.url, "_self");
        }
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.detail ?? "Failed to generate payment link. Please try again.",
        });
      })
      .finally(() => {
        setUpgradeLoader(false);
      });
  };

  return (
    <section className="relative w-full overflow-y-auto">
      <div>
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium flex gap-4">Billing and plans</h3>
        </div>
      </div>
      <div className="py-6">
        <div className="px-6 py-4 border border-custom-border-100 rounded-lg shadow-sm">
          {!subscriptionDetail && (
            <Loader className="flex w-full justify-between">
              <Loader.Item height="30px" width="40%" />
              <Loader.Item height="30px" width="20%" />
            </Loader>
          )}
          {subscriptionDetail && (
            <>
              {subscriptionDetail.product === "FREE" &&
                (subscriptionDetail.is_self_managed ? (
                  <SelfHostedFreePlanCard />
                ) : (
                  <CloudFreePlanCard
                    isProductsAPILoading={isProductsAPILoading}
                    trialLoader={trialLoader}
                    upgradeLoader={upgradeLoader}
                    handleTrial={handleTrial}
                    handleUpgrade={handleStripeCheckout}
                  />
                ))}
              {subscriptionDetail.product === "ONE" && <OnePlanCard />}
              {subscriptionDetail.product === "PRO" && (
                <ProPlanCard upgradeLoader={upgradeLoader} handleUpgrade={handleStripeCheckout} />
              )}
            </>
          )}
        </div>
      </div>
      <div className="text-xl font-semibold mt-3">All Plans</div>
      <PlansComparison
        isProductsAPILoading={isProductsAPILoading}
        trialLoader={trialLoader}
        upgradeLoader={upgradeLoader}
        proProduct={proProduct}
        selectedFrequency={selectedFrequency}
        setSelectedFrequency={setSelectedFrequency}
        handleTrial={handleTrial}
        handleUpgrade={handleStripeCheckout}
      />
    </section>
  );
});
