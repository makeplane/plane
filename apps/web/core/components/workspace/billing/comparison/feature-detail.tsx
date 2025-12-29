import { CheckCircle2, Minus, MinusCircle } from "lucide-react";
import type { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";
// constants
import type { TPlanFeatureData } from "@/constants/plans";

type TPlanFeatureDetailProps = {
  subscriptionType: EProductSubscriptionEnum;
  data: TPlanFeatureData;
};

export function PlanFeatureDetail(props: TPlanFeatureDetailProps) {
  const { subscriptionType, data } = props;

  if (data === null || data === undefined) {
    return <Minus className="size-4 text-placeholder" />;
  }
  if (data === true) {
    return <CheckCircle2 className="size-4 text-accent-primary" />;
  }
  if (data === false) {
    return <MinusCircle className="size-4 text-placeholder" />;
  }
  return <>{data}</>;
}
