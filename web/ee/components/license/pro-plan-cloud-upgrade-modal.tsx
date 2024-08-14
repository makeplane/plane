import { FC, useState } from "react";
import orderBy from "lodash/orderBy";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Dialog } from "@headlessui/react";
// types
import { IPaymentProduct } from "@plane/types";
// ui
import { EModalWidth, Loader, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// plane web constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { useEventTracker, useUser } from "@/hooks/store";
import { PRO_PLAN_FEATURES_MAP } from "@/plane-web/constants/license";
// plane web services
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/plane-web/services/payment.service";
// local components
import { ProPlanUpgrade } from "./pro-plan-upgrade";

const paymentService = new PaymentService();

export type ProPlanCloudUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  yearlyPlan?: boolean;
  handleSuccessModal?: () => void;
  canFetchProducts?: boolean;
};

// constants
export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPricePerMonth: number): number => {
  const monthlyCost = monthlyPrice * 12;
  const yearlyCost = yearlyPricePerMonth * 12;
  const amountSaved = monthlyCost - yearlyCost;
  const discountPercentage = (amountSaved / monthlyCost) * 100;
  return Math.floor(discountPercentage);
};

export const ProPlanCloudUpgradeModal: FC<ProPlanCloudUpgradeModalProps> = (props) => {
  const { isOpen, handleClose, yearlyPlan, handleSuccessModal, canFetchProducts = true } = props;
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isLoading, setLoading] = useState(false);
  const [trialLoader, setTrialLoader] = useState(false);
  // store hooks
  const { captureEvent } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    fetchWorkspaceSubscribedPlan,
    freeTrialSubscription,
  } = useWorkspaceSubscription();
  // derived values
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  // fetch products
  const { isLoading: isProductsAPILoading, data } = useSWR(
    workspaceSlug && canFetchProducts ? "CLOUD_PAYMENT_PRODUCTS" : null,
    workspaceSlug && canFetchProducts ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  const proProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "PRO");

  const handleStripeCheckout = (priceId: string) => {
    setLoading(true);
    paymentService
      .getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
        price_id: priceId,
        product_id: proProduct?.id,
      })
      .then((response) => {
        if (response.payment_link) {
          window.open(response.payment_link, "_self");
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
        setLoading(false);
        handleClose();
      });
  };

  const handlePlanUpgrade = (priceId: string) => {
    setLoading(true);
    paymentService
      .upgradeCurrentWorkspaceSubscription(workspaceSlug.toString(), {
        price_id: priceId,
        product_id: proProduct?.id,
      })
      .then(async () => {
        await fetchWorkspaceSubscribedPlan(workspaceSlug.toString());
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Your workspace has been upgraded to Pro yearly plan.",
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.detail ?? "Failed to upgrade. Please try again.",
        });
      })
      .finally(() => {
        setLoading(false);
        handleClose();
      });
  };

  // handling the payment link when the free trial is disabled
  const handlePaymentLink = (priceId: string) => {
    if (!workspaceSlug) return;

    if (!isAdmin) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Unauthorized!",
        message: "You don't have permission to perform this action.",
      });
      return;
    }

    if (!priceId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
      return;
    }

    captureEvent("pro_plan_payment_link_clicked", { workspaceSlug });

    if (yearlyPlan) {
      handlePlanUpgrade(priceId);
    } else {
      handleStripeCheckout(priceId);
    }
  };

  // handling the payment link when the free trial is enabled
  const handleSubscriptionPageRedirection = () => {
    if (!workspaceSlug) return;

    if (!isAdmin) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Unauthorized!",
        message: "You don't have permission to perform this action.",
      });
      return;
    }

    setLoading(true);
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
        setLoading(false);
      });
  };

  // handle trial
  const handleTrial = async (productId: string, priceId: string) => {
    try {
      setTrialLoader(true);
      if (!workspaceSlug) return;
      await freeTrialSubscription(workspaceSlug.toString(), { product_id: productId, price_id: priceId });
      handleClose && handleClose();
      handleSuccessModal && handleSuccessModal();
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

  // derived values
  const monthlyPrice =
    (orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find((price) => price.recurring === "month")
      ?.unit_amount || 0) / 100;
  const yearlyPrice =
    (orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find((price) => price.recurring === "year")
      ?.unit_amount || 0) / 1000;
  const yearlyDiscount = calculateYearlyDiscount(monthlyPrice, yearlyPrice);
  const isInTrailPeriod =
    subscriptionDetail?.has_activated_free_trial && subscriptionDetail?.trial_end_date ? true : false;
  const isTrialCompleted =
    subscriptionDetail?.has_activated_free_trial && !subscriptionDetail?.trial_end_date ? true : false;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL} className="rounded-xl">
      <div className="py-6 px-10 max-h-[90vh] sm:max-h-[95vh] overflow-auto">
        {isInTrailPeriod && (
          <div className="relative flex justify-center items-center">
            <div className="p-1 px-2 uppercase bg-custom-primary-100/20 text-custom-primary-100 text-xs rounded-full font-medium">
              Free Trial
            </div>
          </div>
        )}
        <Dialog.Title as="h2" className="text-2xl font-bold leading-6 mt-6 flex justify-center items-center">
          Upgrade to Pro, yearly for flat {yearlyDiscount}% off.
        </Dialog.Title>
        <div className="mt-3 mb-12">
          <p className="text-center text-sm mb-4 px-10 text-custom-text-100">
            Pro unlocks everything that teams need to make progress and move work forward.Upgrade today and get&nbsp;
            {yearlyDiscount}% off on your yearly bill.
          </p>
          <p className="text-center text-sm text-custom-primary-200 font-semibold underline">
            <a href="https://plane.so/pro" target="_blank">
              Learn more
            </a>
          </p>
        </div>
        {isProductsAPILoading && (
          <Loader className="p-4 flex flex-col items-center justify-center gap-4">
            <Loader.Item height="35px" width="15rem" />
            <Loader.Item height="35px" width="7rem" />
            <Loader.Item height="35px" width="5rem" />
            <Loader.Item height="25px" width="10rem" />
            <Loader.Item height="40px" width="16rem" />
            <Loader className="grid grid-cols-12 gap-x-4 py-4 w-full">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="col-span-6 p-2">
                  <Loader.Item height="20px" width="100%" />
                </div>
              ))}
            </Loader>
          </Loader>
        )}

        {proProduct && (
          <ProPlanUpgrade
            proProduct={proProduct}
            basePlan="Free"
            features={PRO_PLAN_FEATURES_MAP}
            isLoading={isLoading}
            handlePaymentLink={(priceId: string) =>
              isInTrailPeriod ? handleSubscriptionPageRedirection() : handlePaymentLink(priceId)
            }
            yearlyPlanOnly={yearlyPlan}
            trialLoader={trialLoader}
            handleTrial={handleTrial}
            yearlyDiscount={yearlyDiscount}
            showTrialButton={!isInTrailPeriod && !isTrialCompleted}
          />
        )}
      </div>
    </ModalCore>
  );
};
