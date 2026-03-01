/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";
// assets
import TeamsUpgradeDark from "@/app/assets/empty-state/teams/dark-upgrade.webp?url";
import TeamsUpgradeLight from "@/app/assets/empty-state/teams/light-upgrade.webp?url";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const TeamspaceUpgrade = observer(function TeamspaceUpgrade() {
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isPlaneOneInstance =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product === EProductSubscriptionEnum.ONE;

  const getUpgradeButton = () => {
    if (isPlaneOneInstance) {
      return (
        <a
          href="https://prime.plane.so/"
          target="_blank"
          className={getButtonStyling("primary", "base")}
          rel="noreferrer"
        >
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
    <div className="w-full">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-h4-semibold">Organize work even better with Teamspaces.</div>
            <div className="text-body-xs-regular">
              Get Teamspaces with a Pro or higher subscription and organize people + their work into a separate space.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {getUpgradeButton()}
              <Link
                target="_blank"
                href="https://plane.so/contact"
                className={"bg-transparent underline text-body-xs-medium text-accent-secondary my-auto"}
                onClick={() => {}}
              >
                Get custom quote
              </Link>
            </div>
          </div>
        </div>
        <img
          src={resolvedTheme === "dark" ? TeamsUpgradeDark : TeamsUpgradeLight}
          alt="Teamspaces upgrade"
          className="max-h-[300px] w-auto self-end flex p-5 pb-0 xl:p-0 object-contain"
        />
      </div>
    </div>
  );
});
