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

import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
import { Button, getButtonStyling } from "@plane/propel/button";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";
// assets
import StateDark from "@/app/assets/runner/dark-upgrade.svg?url";
import StateLight from "@/app/assets/runner/light-upgrade.svg?url";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

const Upgrade = observer(function Upgrade() {
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isSelfManagedUpgradeDisabled =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== EProductSubscriptionEnum.FREE;

  return (
    <div
      className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
        "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
        "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-subtle": !resolvedTheme?.includes("dark"),
      })}
    >
      <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
        <div className="flex flex-col gap-2 w-full xl:max-w-[300px]">
          <div className="text-h5-medium text-primary">Automate at the speed of thought with Plane Runner.</div>
          <div className="text-13 text-placeholder">
            Offload repetitive tasks and trigger custom scripts instantly. Build, test, and deploy without leaving your
            workspace.
          </div>
          <div className="flex mt-6 gap-4 flex-wrap">
            {isSelfManagedUpgradeDisabled ? (
              <a
                href="https://prime.plane.so/"
                target="_blank"
                className={getButtonStyling("primary", "base")}
                rel="noreferrer"
              >
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
              className={"bg-transparent underline text-13 text-accent-secondary my-auto font-medium"}
              onClick={() => {}}
            >
              Get custom quote
            </Link>
          </div>
        </div>
      </div>
      <img
        src={resolvedTheme === "dark" ? StateDark : StateLight}
        alt="Project states upgrade"
        className="max-h-[400px] self-end "
      />
    </div>
  );
});

export function RunnersUpgrade() {
  return (
    <div className="w-full">
      <Upgrade />
    </div>
  );
}
