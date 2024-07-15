import { FC } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// store
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
};

export const UpgradeBadge: FC<TUpgradeBadge> = observer((props) => {
  const { className, size = "sm" } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  // derived values
  const isSubscribedToPro = currentWorkspaceSubscribedPlanDetail?.product === "PRO";

  if (!currentWorkspaceSubscribedPlanDetail || isSubscribedToPro) {
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
