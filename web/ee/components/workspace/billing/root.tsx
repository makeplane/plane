import { useState } from "react";
import orderBy from "lodash/orderBy";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// types
import { IPaymentProduct, TProductSubscriptionType } from "@plane/types";
// ui
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// plane web components
import { CloudFreePlanCard, OnePlanCard, ProPlanCard, SelfHostedFreePlanCard } from "@/plane-web/components/license";
import { PlansComparison } from "@/plane-web/components/workspace/billing";
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
  const { isLoading: isProductsAPILoading, data } = useSWR(
    workspaceSlug ? `PAYMENT_PRODUCTS_${workspaceSlug?.toString()}` : null,
    workspaceSlug ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const oneProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "ONE");
  const oneProductPrice = oneProduct?.prices?.[0];
  const proProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "PRO");
  const monthlyPrice = orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "month"
  );
  const yearlyPrice = orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find(
    (price) => price.recurring === "year"
  );

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

  const getProductId = (productType: TProductSubscriptionType) => {
    switch (productType) {
      case "ONE":
        return oneProduct?.id;
      case "PRO":
        return proProduct?.id;
      default:
        return null;
    }
  };

  const getPriceId = (productType: TProductSubscriptionType) => {
    switch (productType) {
      case "ONE":
        return oneProductPrice?.id;
      case "PRO":
        return selectedFrequency === "year" ? yearlyPrice?.id : monthlyPrice?.id;
      default:
        return null;
    }
  };

  const handleStripeCheckout = (productType: TProductSubscriptionType) => {
    // Redirect to the payment link from the payment server
    const selectedProductId = getProductId(productType);
    const selectedPriceId = getPriceId(productType);
    if (!selectedProductId || !selectedPriceId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Unable to get the product id or price id. Please try again.",
      });
      return;
    }
    setUpgradeLoader(true);
    paymentService
      .getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
        price_id: selectedPriceId,
        product_id: selectedProductId,
      })
      .then((response) => {
        if (response.url) {
          window.open(response.url, isSelfManaged ? "_blank" : "_self");
        }
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Failed to generate payment link. Please try again.",
        });
      })
      .finally(() => {
        setUpgradeLoader(false);
      });
  };

  return (
    <section className="relative w-full overflow-y-auto">
      <div>
        <div className="flex items-center">
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
      <div className="text-xl font-semibold mt-3">All plans</div>
      <PlansComparison
        isProductsAPILoading={isProductsAPILoading}
        trialLoader={trialLoader}
        upgradeLoader={upgradeLoader}
        selectedFrequency={selectedFrequency}
        setSelectedFrequency={setSelectedFrequency}
        handleTrial={handleTrial}
        handleUpgrade={handleStripeCheckout}
      />
    </section>
  );
});
