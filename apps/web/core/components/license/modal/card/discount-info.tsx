import { useTheme } from "next-themes";
// plane imports
import { EProductSubscriptionEnum, TBillingFrequency } from "@plane/types";
import { cn } from "@plane/utils";

type TDiscountInfoProps = {
  className?: string;
  currency: string;
  frequency: TBillingFrequency;
  price: number;
  subscriptionType: EProductSubscriptionEnum;
};

const PLANS_WITH_DISCOUNT = [EProductSubscriptionEnum.PRO];

const getActualPrice = (frequency: TBillingFrequency, subscriptionType: EProductSubscriptionEnum): number | null => {
  switch (subscriptionType) {
    case EProductSubscriptionEnum.PRO:
      return frequency === "month" ? 10 : 8;
    default:
      return null;
  }
};

export const DiscountInfo = ({ className, currency, frequency, price, subscriptionType }: TDiscountInfoProps) => {
  const { resolvedTheme } = useTheme();
  // derived values
  const actualPrice = getActualPrice(frequency, subscriptionType);

  if (!PLANS_WITH_DISCOUNT.includes(subscriptionType)) {
    return (
      <>
        {currency}
        {price}
      </>
    );
  }

  return (
    <>
      {actualPrice != price && (
        <span className={cn("relative", className)}>
          <img
            src={
              resolvedTheme === "dark"
                ? "https://images.plane.so/pricing/hero/scribble-white.svg"
                : "https://images.plane.so/pricing/hero/scribble-black.svg"
            }
            alt="image"
            className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-full scale-x-125"
          />
          {currency}
          {actualPrice}
        </span>
      )}
      {currency}
      {price}
    </>
  );
};
