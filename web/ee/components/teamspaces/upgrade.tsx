"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import TeamsUpgradeDark from "@/public/empty-state/teams/dark-upgrade.webp";
import TeamsUpgradeLight from "@/public/empty-state/teams/light-upgrade.webp";

export const TeamspaceUpgrade: FC = observer(() => {
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isPlaneOneInstance =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product === EProductSubscriptionEnum.ONE;

  const getUpgradeButton = () => {
    if (isPlaneOneInstance) {
      return (
        <a href="https://prime.plane.so/" target="_blank" className={getButtonStyling("primary", "md")}>
          Upgrade to higher subscription
        </a>
      );
    }

    return (
      <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
        <Crown className="h-3.5 w-3.5" />
        Upgrade
      </Button>
    );
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
            <div className="text-2xl font-semibold">Organize work even better with Teamspaces.</div>
            <div className="text-sm">
              Get Teamspaces with a Pro or higher subscription and organize people + their work into a separate space.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {getUpgradeButton()}
              <Link
                target="_blank"
                href="https://plane.so/contact"
                className={"bg-transparent underline text-sm text-custom-primary-200 my-auto font-medium"}
                onClick={() => {}}
              >
                Get custom quote
              </Link>
            </div>
          </div>
        </div>
        <Image
          src={resolvedTheme === "dark" ? TeamsUpgradeDark : TeamsUpgradeLight}
          alt=""
          className="max-h-[300px] w-auto self-end flex p-5 pb-0 xl:p-0 object-contain"
        />
      </div>
    </div>
  );
});
