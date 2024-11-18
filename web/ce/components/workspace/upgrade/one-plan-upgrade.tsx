import { FC, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
// types
import { IPaymentProduct } from "@plane/types";
// ui
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web services
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

export type OnePlanUpgradeProps = {
  features: string[];
  oneProduct: IPaymentProduct | undefined;
  isLoading?: boolean;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
};

export const OnePlanUpgrade: FC<OnePlanUpgradeProps> = (props) => {
  const { features, oneProduct, isLoading, verticalFeatureList = false, extraFeatures } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [upgradeLoader, setUpgradeLoader] = useState(false);

  const handleStripeCheckout = () => {
    // Redirect to the payment link from the payment server
    const selectedProductId = oneProduct?.id;
    const selectedPriceId = oneProduct?.prices?.[0].id;
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
          window.open(response.url, "_blank");
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
    <div className="py-4 px-2 border border-custom-border-90 rounded-xl bg-custom-background-90">
      <div className="flex w-full justify-center h-10" />
      <div className="pt-6 pb-4 text-center font-semibold">
        <div className="text-2xl">Plane One</div>
        <div className="text-3xl">$799</div>
        <div className="text-sm text-custom-text-300">for two years’ support and updates</div>
      </div>
      {isLoading ? (
        <Loader className="flex flex-col items-center justify-center">
          <Loader.Item height="40px" width="14rem" />
        </Loader>
      ) : (
        <div className="flex justify-center w-full">
          <button
            className={cn(
              "relative inline-flex items-center justify-center w-56 px-4 py-2.5 text-white text-sm font-medium border border-[#525252] bg-gradient-to-r from-[#353535] via-[#1111118C] to-[#21212153] rounded-lg focus:outline-none",
              {
                "opacity-70 cursor-not-allowed": upgradeLoader,
              }
            )}
            onClick={handleStripeCheckout}
            disabled={upgradeLoader}
          >
            {upgradeLoader ? "Redirecting to Stripe..." : "Upgrade to One"}
          </button>
        </div>
      )}
      <div className="px-2 pt-6 pb-2">
        <div className="p-2 text-sm font-semibold">Everything in Free +</div>
        <ul className="w-full grid grid-cols-12 gap-x-4">
          {features.map((feature) => (
            <li
              key={feature}
              className={cn("col-span-12 relative rounded-md p-2 flex", {
                "sm:col-span-6": !verticalFeatureList,
              })}
            >
              <p className="w-full text-sm font-medium leading-5 flex items-center">
                <CheckCircle className="h-4 w-4 mr-4 text-custom-text-300 flex-shrink-0" />
                <span className="text-custom-text-200 truncate">{feature}</span>
              </p>
            </li>
          ))}
        </ul>
        {extraFeatures && <div>{extraFeatures}</div>}
      </div>
    </div>
  );
};
