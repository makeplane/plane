// plane imports
import { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";
import { getSubscriptionTextAndBackgroundColor } from "@/components/workspace/billing/subscription";

type TProps = {
  subscriptionType: EProductSubscriptionEnum;
  handleClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export const SubscriptionButton = (props: TProps) => {
  const { subscriptionType, handleClick, children, className } = props;
  // derived values
  const subscriptionColor =
    subscriptionType === EProductSubscriptionEnum.FREE
      ? "bg-custom-primary-200/15 text-custom-primary-300"
      : getSubscriptionTextAndBackgroundColor(subscriptionType);

  return (
    <button
      tabIndex={-1}
      className={cn(
        "relative flex items-center gap-x-1.5 w-fit cursor-pointer rounded-2xl px-2.5 py-1 text-center text-sm font-medium outline-none hover:opacity-90",
        subscriptionColor,
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
