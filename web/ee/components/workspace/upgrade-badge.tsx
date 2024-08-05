import { FC } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// store
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web hooks
import { E_FEATURE_FLAGS, useFlag } from "@/plane-web/hooks/store/use-flag";

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
  flag?: keyof typeof E_FEATURE_FLAGS;
};

export const UpgradeBadge: FC<TUpgradeBadge> = observer((props) => {
  const { className, size = "sm", flag } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  // derived values
  const isFeatureEnabled = flag ? useFlag(flag) : false;
  const isSubscribedToPro = currentWorkspaceSubscribedPlanDetail?.product === "PRO";

  if (!currentWorkspaceSubscribedPlanDetail || isFeatureEnabled || isSubscribedToPro) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-fit cursor-pointer rounded-2xl text-custom-primary-200 bg-custom-primary-100/20 text-center font-medium outline-none",
        {
          "text-sm px-3": size === "md",
          "text-xs px-2": size === "sm",
        },
        className
      )}
    >
      Pro
    </div>
  );
});
