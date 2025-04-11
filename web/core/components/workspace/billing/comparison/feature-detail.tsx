import { FC } from "react";
import { CheckCircle2, Minus, MinusCircle } from "lucide-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { cn } from "@plane/utils";
// constants
import { getSubscriptionTextColor } from "@/components/workspace/billing/subscription";
import { TPlanFeatureData } from "@/constants/plans";

type TPlanFeatureDetailProps = {
  subscriptionType: EProductSubscriptionEnum;
  data: TPlanFeatureData;
};

export const PlanFeatureDetail: FC<TPlanFeatureDetailProps> = (props) => {
  const { subscriptionType, data } = props;

  if (data === null || data === undefined) {
    return <Minus className="size-4 text-custom-text-400" />;
  }
  if (data === true) {
    return <CheckCircle2 className={cn(getSubscriptionTextColor(subscriptionType), "size-4")} />;
  }
  if (data === false) {
    return <MinusCircle className="size-4 text-custom-text-400" />;
  }
  return <>{data}</>;
};
