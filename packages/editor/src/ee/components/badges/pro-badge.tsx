import { ReactNode } from "react";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionTextAndBackgroundColor } from "@plane/ui";
import { cn } from "@plane/utils";

interface ProBadgeProps {
  className?: string;
}

export const ProBadge = ({ className }: ProBadgeProps): ReactNode => (
  <div
    className={cn(
      getSubscriptionTextAndBackgroundColor(EProductSubscriptionEnum.PRO),
      "w-fit rounded text-center font-medium text-sm px-2 shrink-0",
      className
    )}
  >
    Pro
  </div>
);
