"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
// ui
import { E_FEATURE_FLAGS } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import CustomerUpgradeDark from "@/public/empty-state/customers/customer-upgrade-dark.png";
import CustomerUpgradeLight from "@/public/empty-state/customers/customer-upgrade-light.png";

export const CustomerUpgrade: FC = observer(() => {
  const { workspaceSlug } = useParams();
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isPlaneOneInstance = subscriptionDetail?.is_self_managed && subscriptionDetail?.product === "ONE";
  const isCustomersFeatureFlagEnabled = useFlag(workspaceSlug.toString(), E_FEATURE_FLAGS.CUSTOMERS);
  const getUpgradeButton = () => {
    if (isPlaneOneInstance) {
      return (
        <a href="https://prime.plane.so/" target="_blank" className={getButtonStyling("primary", "md")}>
          Upgrade to higher subscription
        </a>
      );
    }

    if (!isCustomersFeatureFlagEnabled) {
      return (
        <Button variant="primary" disabled>
          Coming Soon
        </Button>
      );
    }
  };

  return (
    <div className="pr-10">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-2xl font-semibold">Customers</div>
            <div className="text-sm">Track and manage customer relationships in your workflow.</div>
            <div className="mt-6">{getUpgradeButton()}</div>
          </div>
        </div>
        <Image
          src={resolvedTheme === "dark" ? CustomerUpgradeDark : CustomerUpgradeLight}
          alt=""
          className="max-h-[300px] self-end flex p-5 pb-0 xl:p-0"
        />
      </div>
    </div>
  );
});
