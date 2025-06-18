import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS, EProductSubscriptionEnum } from "@plane/constants";
import { cn } from "@plane/utils";
// store
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
  flag?: keyof typeof E_FEATURE_FLAGS;
};

export const UpgradeBadge: FC<TUpgradeBadge> = observer((props) => {
  const { className, size = "sm", flag } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  // derived values
  const isFeatureEnabled = flag ? useFlag(workspaceSlug?.toString(), flag) : false;
  const isSubscribedToPro = currentWorkspaceSubscribedPlanDetail?.product === EProductSubscriptionEnum.PRO;

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
