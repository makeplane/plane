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
import { useTheme } from "@plane/react-theme";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";
// assets
import PiUpgradeDark from "@/app/assets/empty-state/pi/chat-dark.webp?url";
import PiUpgradeLight from "@/app/assets/empty-state/pi/chat-light.webp?url";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const PiChatUpgrade = observer(function PiChatUpgrade() {
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
            <div className="text-20 font-semibold text-primary">Experience an AI-powered teammate </div>
            <div className="text-13 text-tertiary">
              Get answers faster, plan better, and ship sooner with AI that understands and lives inside your work.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {getUpgradeButton()}
              <Link
                target="_blank"
                href="https://plane.so/talk-to-sales"
                className={"bg-transparent underline text-13 text-primary my-auto font-medium"}
                onClick={() => {}}
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
        <img
          src={resolvedTheme === "dark" ? PiUpgradeDark : PiUpgradeLight}
          alt="AI chat upgrade"
          className="max-h-[300px] w-auto self-end flex p-5 pb-0 xl:p-0 object-contain rounded-br-xl"
        />
      </div>
    </div>
  );
});
