"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
// ui
import { Crown } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

import ProjectUpdatesUpgradeDark from "@/public/empty-state/project-settings/updates-dark.png";
import ProjectUpdatesUpgradeLight from "@/public/empty-state/project-settings/updates-light.png";

export const ProjectUpdatesUpgrade = observer(() => {
  // store hooks
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isSelfManagedUpgradeDisabled =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== EProductSubscriptionEnum.FREE;

  return (
    <div className="w-full">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="flex flex-col w-full xl:max-w-[360px] gap-y-4">
            <div className="text-xl font-semibold">Track all your projects from one screen. </div>
            <div className="font-medium text-custom-text-300 text-sm">
              Group Projects like you group work items by state, priority, or any other—and track their progress in one
              click.
            </div>

            <div className="flex mt-6 gap-4 flex-wrap">
              {isSelfManagedUpgradeDisabled ? (
                <a href="https://prime.plane.so/" target="_blank" className={getButtonStyling("primary", "md")}>
                  <Crown className="h-3.5 w-3.5" />
                  Get Pro
                </a>
              ) : (
                <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
                  <Crown className="h-3.5 w-3.5" />
                  Upgrade
                </Button>
              )}
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
          src={resolvedTheme === "dark" ? ProjectUpdatesUpgradeDark : ProjectUpdatesUpgradeLight}
          alt=""
          className="max-h-[320px] max-w-[430px] self-end flex p-5 pb-0 xl:p-0 w-auto"
        />
      </div>
    </div>
  );
});
