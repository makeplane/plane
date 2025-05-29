import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import {
  DEFAULT_PRODUCT_BILLING_FREQUENCY,
  EProductSubscriptionEnum,
  SUBSCRIPTION_WITH_BILLING_FREQUENCY,
} from "@plane/constants";
import {
  IPaymentProduct,
  IPaymentProductPrice,
  TBillingFrequency,
  TProductBillingFrequency,
  TUpgradeParams,
} from "@plane/types";
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
import { cn, getSubscriptionProduct, getSubscriptionProductPrice } from "@plane/utils";
// helpers
import { getBillingAndPlansCardVariantStyle } from "@/components/workspace/billing/subscription";
// plane web imports
import {
  CloudFreePlanCard,
  OnePlanCard,
  ProPlanCard,
  BusinessPlanCard,
  SelfHostedFreePlanCard,
  EnterprisePlanCard,
} from "@/plane-web/components/license";
import { PlansComparison } from "@/plane-web/components/workspace/billing/comparison";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

export const BillingRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  // states
  const [isScrolled, setIsScrolled] = useState(false);
  const [productBillingFrequency, setProductBillingFrequency] = useState<TProductBillingFrequency>(
    DEFAULT_PRODUCT_BILLING_FREQUENCY
  );
  const [upgradeLoader, setUpgradeLoader] = useState<EProductSubscriptionEnum | null>(null);
  const [trialLoader, setTrialLoader] = useState<EProductSubscriptionEnum | null>(null);
  const [isCompareAllFeaturesSectionOpen, setIsCompareAllFeaturesSectionOpen] = useState(false);
  // store hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    freeTrialSubscription,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  // fetch products
  const { isLoading: isProductsAPILoading, data } = useSWR(
    workspaceSlug ? ["PAYMENT_PRODUCTS", workspaceSlug.toString()] : null,
    workspaceSlug ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const planCardVariantStyle =
    subscriptionDetail?.product && subscriptionDetail?.product !== EProductSubscriptionEnum.FREE
      ? getBillingAndPlansCardVariantStyle(subscriptionDetail?.product)
      : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const isScrolled = isCompareAllFeaturesSectionOpen ? scrollTop > 0 : false;
      setIsScrolled(isScrolled);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isCompareAllFeaturesSectionOpen]);

  /**
   * Initiates a free trial for a selected subscription plan
   * @param {TUpgradeParams} trialParams - Object containing trial subscription parameters
   * @param {EProductSubscriptionEnum} trialParams.selectedSubscriptionType - Type of subscription to start trial for
   * @param {string} trialParams.selectedProductId - ID of the product to start trial for
   * @param {string} trialParams.selectedPriceId - ID of the price to start trial for
   * @returns {Promise<void>} - Resolves when trial is started or rejects with error
   * @throws {Error} - If product/price IDs are missing or trial fails
   */
  const handleTrial = async (trialParams: TUpgradeParams): Promise<void> => {
    const { selectedSubscriptionType, selectedProductId, selectedPriceId } = trialParams;
    if (isSelfManaged) return; // Self-hosted workspaces can't have trials
    if (!selectedProductId || !selectedPriceId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Missing product or price ID" });
      return;
    }
    try {
      setTrialLoader(selectedSubscriptionType);
      if (!workspaceSlug) return;
      await freeTrialSubscription(workspaceSlug.toString(), {
        product_id: selectedProductId,
        price_id: selectedPriceId,
      });
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
      setTrialLoader(null);
    }
  };

  /**
   * Processes subscription upgrade by generating payment link and redirecting user
   * @param {TUpgradeParams} upgradeParams - Object containing upgrade parameters
   * @param {EProductSubscriptionEnum} upgradeParams.selectedSubscriptionType - Type of subscription to upgrade to
   * @param {string} upgradeParams.selectedProductId - ID of the product to upgrade to
   * @param {string} upgradeParams.selectedPriceId - ID of the price to upgrade to
   * @param {boolean} upgradeParams.isActive - Whether the product is currently active
   * @returns {void}
   */
  const handleUpgradeSubscription = async (upgradeParams: TUpgradeParams): Promise<void> => {
    const { selectedSubscriptionType, selectedProductId, selectedPriceId, isActive } = upgradeParams;
    if (!isActive) {
      window.open("https://plane.so/talk-to-sales", "_blank");
      return;
    }
    if (!selectedProductId || !selectedPriceId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Missing product or price ID" });
      return;
    }
    setUpgradeLoader(selectedSubscriptionType);
    paymentService
      .getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
        price_id: selectedPriceId,
        product_id: selectedProductId,
      })
      .then((response) => {
        if (response.url) window.open(response.url, isSelfManaged ? "_blank" : "_self");
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Failed to generate payment link",
        });
      })
      .finally(() => setUpgradeLoader(null));
  };

  /**
   * Retrieves the billing frequency for a given subscription type
   * @param {EProductSubscriptionEnum} subscriptionType - Type of subscription to get frequency for
   * @returns {TBillingFrequency | undefined} - Billing frequency if subscription supports it, undefined otherwise
   */
  const getBillingFrequency = (subscriptionType: EProductSubscriptionEnum): TBillingFrequency | undefined =>
    SUBSCRIPTION_WITH_BILLING_FREQUENCY.includes(subscriptionType)
      ? productBillingFrequency[subscriptionType]
      : undefined;

  /**
   * Updates the billing frequency for a specific subscription type
   * @param {EProductSubscriptionEnum} subscriptionType - Type of subscription to update
   * @param {TBillingFrequency} frequency - New billing frequency to set
   * @returns {void}
   */
  const setBillingFrequency = (subscriptionType: EProductSubscriptionEnum, frequency: TBillingFrequency): void =>
    setProductBillingFrequency({ ...productBillingFrequency, [subscriptionType]: frequency });

  /**
   * Retrieves the selected product and price details for a subscription type
   * @param {EProductSubscriptionEnum} selectedSubscriptionType - Type of subscription to get details for
   * @returns {Object} Object containing selected product and price information
   * @returns {IPaymentProduct | undefined} selectedProduct - Selected product details
   * @returns {IPaymentPrice | undefined} selectedPrice - Selected price details
   */
  const getSelectedProductAndPrice = (
    selectedSubscriptionType: EProductSubscriptionEnum
  ): {
    selectedProduct: IPaymentProduct | undefined;
    selectedPrice: IPaymentProductPrice | null;
  } => {
    const selectedProduct = getSubscriptionProduct(data, selectedSubscriptionType);
    const selectedPrice = getSubscriptionProductPrice(selectedProduct, getBillingFrequency(selectedSubscriptionType));
    return { selectedProduct, selectedPrice };
  };

  /**
   * Handles the upgrade process for a selected plan
   * @param {EProductSubscriptionEnum} selectedSubscriptionType - Type of subscription to upgrade to
   * @returns {void}
   */
  const handleSelectedPlanUpgrade = (selectedSubscriptionType: EProductSubscriptionEnum): Promise<void> => {
    const { selectedProduct, selectedPrice } = getSelectedProductAndPrice(selectedSubscriptionType);
    return handleUpgradeSubscription({
      selectedSubscriptionType,
      selectedProductId: selectedProduct?.id,
      selectedPriceId: selectedPrice?.id,
      isActive: !!selectedProduct?.is_active,
    });
  };

  /**
   * Handles the trial process for a selected plan
   * @param {EProductSubscriptionEnum} selectedSubscriptionType - Type of subscription to start trial for
   * @returns {Promise<void>}
   */
  const handleSelectedPlanTrial = (selectedSubscriptionType: EProductSubscriptionEnum): Promise<void> => {
    const { selectedProduct, selectedPrice } = getSelectedProductAndPrice(selectedSubscriptionType);
    return handleTrial({
      selectedSubscriptionType,
      selectedProductId: selectedProduct?.id,
      selectedPriceId: selectedPrice?.id,
      isActive: !!selectedProduct?.is_active,
    });
  };

  return (
    <section className="relative size-full flex flex-col overflow-y-auto scrollbar-hide">
      <div>
        <div className="flex items-center">
          <h3 className="text-xl font-medium flex gap-4">Billing and plans</h3>
        </div>
      </div>
      <div
        className={cn(
          "transition-all duration-500 ease-in-out will-change-[height,opacity]",
          isScrolled ? "h-0 opacity-0 pointer-events-none" : "h-[300px] opacity-100"
        )}
      >
        <div className="py-6">
          <div className={cn("px-6 py-4 border border-custom-border-200 rounded-lg", planCardVariantStyle)}>
            {!subscriptionDetail && (
              <Loader className="flex w-full justify-between">
                <Loader.Item height="30px" width="40%" />
                <Loader.Item height="30px" width="20%" />
              </Loader>
            )}
            {subscriptionDetail && (
              <>
                {subscriptionDetail.product === EProductSubscriptionEnum.FREE &&
                  (subscriptionDetail.is_self_managed ? (
                    <SelfHostedFreePlanCard />
                  ) : (
                    <CloudFreePlanCard
                      upgradeProductType={EProductSubscriptionEnum.PRO}
                      isProductsAPILoading={isProductsAPILoading}
                      trialLoader={trialLoader}
                      upgradeLoader={upgradeLoader}
                      handleTrial={handleSelectedPlanTrial}
                      handleUpgrade={handleSelectedPlanUpgrade}
                    />
                  ))}
                {subscriptionDetail.product === EProductSubscriptionEnum.ONE && <OnePlanCard />}
                {subscriptionDetail.product === EProductSubscriptionEnum.PRO && (
                  <ProPlanCard upgradeLoader={upgradeLoader} handleUpgrade={handleSelectedPlanUpgrade} />
                )}
                {subscriptionDetail.product === EProductSubscriptionEnum.BUSINESS && (
                  <BusinessPlanCard upgradeLoader={upgradeLoader} handleUpgrade={handleSelectedPlanUpgrade} />
                )}
                {subscriptionDetail.product === EProductSubscriptionEnum.ENTERPRISE && (
                  <EnterprisePlanCard upgradeLoader={upgradeLoader} handleUpgrade={handleSelectedPlanUpgrade} />
                )}
              </>
            )}
          </div>
        </div>
        <div className="text-xl font-semibold mt-3">All plans</div>
      </div>
      <PlansComparison
        ref={containerRef}
        products={data}
        isScrolled={isScrolled}
        isProductsAPILoading={isProductsAPILoading}
        trialLoader={trialLoader}
        upgradeLoader={upgradeLoader}
        isCompareAllFeaturesSectionOpen={isCompareAllFeaturesSectionOpen}
        handleTrial={handleTrial}
        handleUpgrade={handleUpgradeSubscription}
        getBillingFrequency={getBillingFrequency}
        setBillingFrequency={setBillingFrequency}
        setIsCompareAllFeaturesSectionOpen={setIsCompareAllFeaturesSectionOpen}
        setIsScrolled={setIsScrolled}
      />
    </section>
  );
});
