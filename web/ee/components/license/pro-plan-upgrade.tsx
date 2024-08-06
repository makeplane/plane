import { FC } from "react";
import orderBy from "lodash/orderBy";
import { CheckCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// types
import { IPaymentProduct, IPaymentProductPrice } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";

export type ProPlanUpgradeProps = {
  proProduct: IPaymentProduct;
  basePlan: "Free" | "One";
  features: string[];
  handlePaymentLink: (priceId: string) => void;
  isLoading?: boolean;
  yearlyPlanOnly?: boolean;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
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

  return (
    <div className="py-4 px-2 border border-custom-primary-200/30 rounded-xl bg-custom-primary-200/5">
      <Tab.Group>
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
                    {price.recurring === "year" && (
                      <span className="bg-gradient-to-r from-[#C78401] to-[#896828] text-white rounded-full px-2 py-1 ml-1 text-xs">
                        -28%
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
                <div className="text-3xl">
                  {price.recurring === "month" && "$7"}
                  {price.recurring === "year" && "$5"}
                </div>
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
                      key={feature}
                      className={cn("col-span-12 relative rounded-md p-2 flex", {
                        "sm:col-span-6": !verticalFeatureList,
                      })}
                    >
                      <p className="w-full text-sm font-medium leading-5 flex items-center line-clamp-1">
                        {!!feature && <CheckCircle className="h-4 w-4 mr-4 text-custom-text-300 flex-shrink-0" />}
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
