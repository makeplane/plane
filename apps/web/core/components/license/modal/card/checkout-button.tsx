"use client";
import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum, IPaymentProduct, TSubscriptionPrice } from "@plane/types";
import { getButtonStyling, getUpgradeButtonStyle, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import { DiscountInfo } from "./discount-info";

export type TCheckoutParams = {
  planVariant: EProductSubscriptionEnum;
  productId: string;
  priceId: string;
};

type Props = {
  planeName: string;
  planVariant: EProductSubscriptionEnum;
  isLoading?: boolean;
  product: IPaymentProduct | undefined;
  price: TSubscriptionPrice;
  upgradeCTA?: string;
  upgradeLoaderType: Omit<EProductSubscriptionEnum, "FREE"> | undefined;
  renderTrialButton?: (props: { productId: string | undefined; priceId: string | undefined }) => React.ReactNode;
  handleCheckout: (params: TCheckoutParams) => void;
  isSelfHosted: boolean;
  isTrialAllowed: boolean;
};

export const PlanCheckoutButton: FC<Props> = observer((props) => {
  const {
    planeName,
    planVariant,
    isLoading,
    product,
    price,
    upgradeCTA,
    upgradeLoaderType,
    renderTrialButton,
    handleCheckout,
    isSelfHosted,
    isTrialAllowed,
  } = props;
  const upgradeButtonStyle =
    getUpgradeButtonStyle(planVariant, !!upgradeLoaderType) ?? getButtonStyling("primary", "lg", !!upgradeLoaderType);

  return (
    <>
      <div className="pb-4 text-center transition-all duration-700 animate-slide-up">
        <div className="text-2xl font-semibold h-9 transition-all duration-300">
          {isLoading ? (
            <Loader className="flex flex-col items-center justify-center">
              <Loader.Item height="36px" width="4rem" />
            </Loader>
          ) : (
            <span className="animate-fade-in">
              <DiscountInfo
                currency={price.currency}
                frequency={price.recurring}
                price={price.price}
                subscriptionType={planVariant}
                className="mr-1.5"
              />
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-custom-text-300 transition-all duration-300 animate-fade-in">
          per user per month
        </div>
      </div>
      {isLoading ? (
        <Loader className="flex flex-col items-center justify-center">
          <Loader.Item height="38px" width="14rem" />
        </Loader>
      ) : (
        <div className="flex flex-col items-center justify-center w-full space-y-4 transition-all duration-300 animate-fade-in">
          <button
            className={cn(
              upgradeButtonStyle,
              "relative inline-flex items-center justify-center w-56 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none"
            )}
            onClick={() => {
              if (product && price.id) {
                handleCheckout({
                  planVariant,
                  productId: product.id,
                  priceId: price.id,
                });
              }
            }}
            disabled={!!upgradeLoaderType}
          >
            {upgradeLoaderType === planVariant ? "Redirecting to Stripe" : (upgradeCTA ?? `Upgrade to ${planeName}`)}
          </button>
          {isTrialAllowed && !isSelfHosted && (
            <div className="mt-4 h-4 transition-all duration-300 animate-fade-in">
              {renderTrialButton &&
                renderTrialButton({
                  productId: product?.id,
                  priceId: price.id,
                })}
            </div>
          )}
        </div>
      )}
    </>
  );
});
