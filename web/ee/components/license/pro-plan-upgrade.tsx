import { FC } from "react";
import orderBy from "lodash/orderBy";
import { CheckCircle, Loader } from "lucide-react";
import { Tab } from "@headlessui/react";
// types
import { IPaymentProduct, IPaymentProductPrice } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";

export type ProPlanUpgradeProps = {
  proProduct: IPaymentProduct;
  basePlan: "Free" | "One";
  features: { label: string; comingSoon: boolean }[];
  handlePaymentLink: (priceId: string) => void;
  isLoading?: boolean;
  yearlyPlanOnly?: boolean;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  trialLoader?: boolean;
  handleTrial?: (productId: string, priceId: string) => void;
  yearlyDiscount?: number;
};

export const ProPlanUpgrade: FC<ProPlanUpgradeProps> = (props) => {
  const {
    proProduct,
    basePlan,
    features,
    handlePaymentLink,
    isLoading = false,
    yearlyPlanOnly = false,
    verticalFeatureList = false,
    extraFeatures,
    trialLoader = false,
    handleTrial,
    yearlyDiscount,
  } = props;
  // derived values
  const yearlyPrice = orderBy(proProduct?.prices || [], ["recurring"], ["desc"]).find(
    (price) => price.recurring === "year"
  );
  const proProductPrices = yearlyPlanOnly
    ? yearlyPrice
      ? [yearlyPrice]
      : []
    : orderBy(proProduct?.prices || [], ["recurring"], ["asc"]);

  const renderPricing = (unitAmount: number, recurring: string): number => {
    let price = 0;
    if (recurring === "month") price = unitAmount / 100;
    if (recurring === "year") price = unitAmount / 1000;
    return price;
  };

  return (
    <div className="py-4 px-2 border border-custom-primary-200/30 rounded-xl bg-custom-primary-200/5">
      <Tab.Group defaultIndex={1}>
        <div className="flex w-full justify-center">
          {!yearlyPlanOnly && (
            <Tab.List className="flex space-x-1 rounded-lg bg-custom-primary-200/10 p-1 w-60">
              {proProductPrices.map((price: IPaymentProductPrice) => (
                <Tab
                  key={price?.id}
                  className={({ selected }) =>
                    cn(
                      "w-full rounded-lg py-1.5 text-sm font-medium leading-5",
                      selected
                        ? "bg-custom-background-100 text-custom-primary-300 shadow"
                        : "hover:bg-custom-primary-100/5 text-custom-text-300 hover:text-custom-text-200"
                    )
                  }
                >
                  <>
                    {price.recurring === "month" && ("Monthly" as string)}
                    {price.recurring === "year" && ("Yearly" as string)}
                    {price.recurring === "year" && yearlyDiscount && (
                      <span className="bg-gradient-to-r from-[#C78401] to-[#896828] text-white rounded-full px-2 py-1 ml-1 text-xs">
                        -{yearlyDiscount}%
                      </span>
                    )}
                  </>
                </Tab>
              ))}
            </Tab.List>
          )}
        </div>
        <Tab.Panels>
          {proProductPrices?.map((price: IPaymentProductPrice) => (
            <Tab.Panel key={price.id}>
              <div className="py-4 text-center font-semibold">
                <div className="text-2xl">Plane Pro</div>
                <div className="text-3xl">{`$${renderPricing(price.unit_amount, price.recurring)}`}</div>
                <div className="text-sm text-custom-text-300">
                  {price.recurring === "month" && "a user per month"}
                  {price.recurring === "year" && "a user per month billed annually"}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center w-full">
                <button
                  type="button"
                  className="relative inline-flex items-center justify-center w-64 px-4 py-2.5 text-white text-sm font-medium border border-[#E9DBBF99]/60 bg-gradient-to-r from-[#C78401] to-[#896828] rounded-lg focus:outline-none"
                  onClick={() => handlePaymentLink(price.id)}
                  disabled={isLoading}
                >
                  {isLoading
                    ? yearlyPlanOnly
                      ? "Upgrading your plan..."
                      : "Redirecting to Stripe..."
                    : "Upgrade to Pro"}
                </button>
                {/* free trail button */}
                <button
                  disabled={trialLoader}
                  className="mt-4 text-center text-sm text-custom-text-300 hover:text-custom-text-100 font-medium transition-all flex justify-center items-center gap-2"
                  onClick={() => handleTrial && handleTrial(proProduct?.id, price.id)}
                >
                  <span>Start free trial</span>
                  <div className="w-3 h-3">{trialLoader && <Loader size={12} className="animate-spin" />}</div>
                </button>
                {yearlyPlanOnly && (
                  <div className="text-[9px] text-custom-text-300 w-64 pt-1">
                    We will charge your card on file at <b>$5 per user per month</b> for the total number of users in
                    your workspace and update your subscription from <b>Pro, monthly</b> or <b>Pro, yearly.</b>
                  </div>
                )}
              </div>
              <div className="px-2 pt-6 pb-2">
                <div className="p-2 text-sm font-semibold">{`Everything in ${basePlan} +`}</div>
                <ul className="grid grid-cols-12 gap-x-4">
                  {features.map((feature) => (
                    <li
                      key={feature?.label}
                      className={cn("col-span-12 relative rounded-md p-2 flex", {
                        "sm:col-span-6": !verticalFeatureList,
                      })}
                    >
                      <div className="w-full text-sm font-medium leading-5 flex items-center">
                        {!!feature && <CheckCircle className="flex-shrink-0 h-4 w-4 mr-3 text-custom-text-300" />}
                        <div className="relative overflow-hidden line-clamp-1">
                          <span className="text-custom-text-200 truncate">{feature?.label}</span>
                        </div>
                        {feature?.comingSoon && (
                          <div className="flex-shrink-0 flex justify-center items-center bg-custom-primary-100/90 text-white text-[7px] rounded-full px-1 h-[12px] -mt-4 ml-1 z-50 whitespace-nowrap">
                            COMING SOON
                          </div>
                        )}
                      </div>
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
