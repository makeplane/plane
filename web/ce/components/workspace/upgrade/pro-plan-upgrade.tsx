"use client";

import { FC, useState } from "react";
import orderBy from "lodash/orderBy";
import { CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { Tab } from "@headlessui/react";
// types
import { IPaymentProduct } from "@plane/types";
// ui
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web services
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

export type ProPlanUpgradeProps = {
  basePlan: "Free" | "One";
  proProduct: IPaymentProduct | undefined;
  isLoading?: boolean;
  features: string[];
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
};

type TProPiceFrequency = "month" | "year";

type TProPlanPrice = {
  key: string;
  currency: string;
  price: number;
  recurring: TProPiceFrequency;
};

// constants
export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPricePerMonth: number): number => {
  const monthlyCost = monthlyPrice * 12;
  const yearlyCost = yearlyPricePerMonth * 12;
  const amountSaved = monthlyCost - yearlyCost;
  const discountPercentage = (amountSaved / monthlyCost) * 100;
  return Math.floor(discountPercentage);
};

const PRO_PLAN_PRICES: TProPlanPrice[] = [
  { key: "monthly", currency: "$", price: 8, recurring: "month" },
  { key: "yearly", currency: "$", price: 6, recurring: "year" },
];

export const ProPlanUpgrade: FC<ProPlanUpgradeProps> = (props) => {
  const { basePlan, features, proProduct, isLoading, verticalFeatureList = false, extraFeatures } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [selectedPlan, setSelectedPlan] = useState<TProPiceFrequency>("month");
  const [upgradeLoader, setUpgradeLoader] = useState(false);
  // derived
  const monthlyPrice = PRO_PLAN_PRICES.find((price) => price.recurring === "month")?.price ?? 0;
  const yearlyPrice = PRO_PLAN_PRICES.find((price) => price.recurring === "year")?.price ?? 0;
  const yearlyDiscount = calculateYearlyDiscount(monthlyPrice, yearlyPrice);

  const handleStripeCheckout = () => {
    // Redirect to the payment link from the payment server
    const selectedProductId = proProduct?.id;
    const monthlyPriceId = orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find(
      (price) => price.recurring === "month"
    )?.id;
    const yearlyPriceId = orderBy(proProduct?.prices || [], ["recurring"], ["desc"])?.find(
      (price) => price.recurring === "year"
    )?.id;
    const selectedPriceId = selectedPlan === "month" ? monthlyPriceId : yearlyPriceId;
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
    <div className="py-4 px-2 border border-custom-primary-200/30 rounded-xl bg-custom-primary-200/5">
      <Tab.Group>
        <div className="flex w-full justify-center h-10">
          <Tab.List className="flex space-x-1 rounded-lg bg-custom-primary-200/10 p-1 w-60">
            {PRO_PLAN_PRICES.map((price: TProPlanPrice) => (
              <Tab
                key={price.key}
                className={({ selected }) =>
                  cn(
                    "w-full rounded-lg py-1.5 text-sm font-medium leading-5",
                    selected
                      ? "bg-custom-background-100 text-custom-primary-300 shadow"
                      : "hover:bg-custom-primary-100/5 text-custom-text-300 hover:text-custom-text-200"
                  )
                }
                onClick={() => setSelectedPlan(price.recurring)}
              >
                <>
                  {price.recurring === "month" && ("Monthly" as string)}
                  {price.recurring === "year" && ("Yearly" as string)}
                  {price.recurring === "year" && (
                    <span className="bg-gradient-to-r from-[#C78401] to-[#896828] text-white rounded-full px-2 py-1 ml-1 text-xs">
                      -{yearlyDiscount}%
                    </span>
                  )}
                </>
              </Tab>
            ))}
          </Tab.List>
        </div>
        <Tab.Panels>
          {PRO_PLAN_PRICES.map((price: TProPlanPrice) => (
            <Tab.Panel key={price.key}>
              <div className="pt-6 pb-4 text-center font-semibold">
                <div className="text-2xl">Plane Pro</div>
                <div className="text-3xl">
                  {price.currency}
                  {price.price}
                </div>
                <div className="text-sm text-custom-text-300">a user per month</div>
              </div>
              {isLoading ? (
                <Loader className="flex flex-col items-center justify-center">
                  <Loader.Item height="40px" width="14rem" />
                </Loader>
              ) : (
                <div className="flex justify-center w-full">
                  <button
                    className={cn(
                      "relative inline-flex items-center justify-center w-56 px-4 py-2.5 text-white text-sm font-medium border border-[#E9DBBF99]/60 bg-gradient-to-r from-[#C78401] to-[#896828] rounded-lg focus:outline-none",
                      {
                        "opacity-70 cursor-not-allowed": upgradeLoader,
                      }
                    )}
                    onClick={handleStripeCheckout}
                    disabled={upgradeLoader}
                  >
                    {upgradeLoader ? "Redirecting to Stripe..." : "Upgrade to Pro"}
                  </button>
                </div>
              )}
              <div className="px-2 pt-6 pb-2">
                <div className="p-2 text-sm font-semibold">{`Everything in ${basePlan} +`}</div>
                <ul className="grid grid-cols-12 gap-x-4">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className={cn("col-span-12 relative rounded-md p-2 flex", {
                        "sm:col-span-6": !verticalFeatureList,
                      })}
                    >
                      <p className="w-full text-sm font-medium leading-5 flex items-center line-clamp-1">
                        <CheckCircle className="h-4 w-4 mr-4 text-custom-text-300 flex-shrink-0" />
                        <span className="text-custom-text-200 truncate">{feature}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                {extraFeatures && <div>{extraFeatures}</div>}
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
