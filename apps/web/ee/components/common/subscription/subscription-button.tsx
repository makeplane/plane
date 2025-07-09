// plane imports
import { EProductSubscriptionEnum } from "@plane/types";
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
import { getSubscriptionTextAndBackgroundColor } from "@/components/workspace/billing/subscription";

type TProps = {
  subscriptionType: EProductSubscriptionEnum;
  handleClick: () => void;
  children: React.ReactNode;
  className?: string;
  tooltipContent?: string;
  showTooltip?: boolean;
};

export const SubscriptionButton = (props: TProps) => {
  const { subscriptionType, handleClick, children, className, tooltipContent, showTooltip = false } = props;
  // derived values
  const subscriptionColor =
    subscriptionType === EProductSubscriptionEnum.FREE
      ? "bg-custom-primary-200/15 text-custom-primary-300"
      : getSubscriptionTextAndBackgroundColor(subscriptionType);

  return (
    <Tooltip disabled={!showTooltip} tooltipContent={tooltipContent}>
      <button
        tabIndex={-1}
        className={cn(
          "relative flex items-center gap-x-1.5 w-fit cursor-pointer rounded-2xl px-2.5 py-1 text-center text-sm font-medium outline-none hover:opacity-90 truncate",
          subscriptionColor,
          className
        )}
        onClick={handleClick}
      >
        {children}
      </button>
    </Tooltip>
  );
};
