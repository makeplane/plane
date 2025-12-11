import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import type { EProductSubscriptionEnum, IPaymentProduct, TSubscriptionPrice } from "@plane/types";
import { Loader } from "@plane/ui";
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

export const PlanCheckoutButton = observer(function PlanCheckoutButton(props: Props) {
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

  return (
    <>
      <div className="pb-4 text-center">
        <div className="text-20 font-semibold h-9">
          {isLoading ? (
            <Loader className="flex flex-col items-center justify-center">
              <Loader.Item height="36px" width="4rem" />
            </Loader>
          ) : (
            <DiscountInfo
              currency={price.currency}
              frequency={price.recurring}
              price={price.price}
              subscriptionType={planVariant}
              className="mr-1.5"
            />
          )}
        </div>
        <div className="text-caption-md-medium text-tertiary">per user per month</div>
      </div>
      {isLoading ? (
        <Loader className="flex flex-col items-center justify-center">
          <Loader.Item height="38px" width="14rem" />
        </Loader>
      ) : (
        <div className="flex flex-col items-center justify-center w-full space-y-4">
          <Button
            variant="primary"
            size="lg"
            className="w-56"
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
          </Button>
          {isTrialAllowed && !isSelfHosted && (
            <div className="mt-1 h-3">
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
