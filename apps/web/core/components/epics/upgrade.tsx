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
import React from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// helpers
import { Crown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";
import EpicsUpgradeDark from "@/app/assets/empty-state/epics/settings-dark.webp?url";
import EpicsUpgradeLight from "@/app/assets/empty-state/epics/settings-light.webp?url";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const EpicsUpgrade = observer(function EpicsUpgrade() {
  // store hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  const isPlaneOneInstance =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product === EProductSubscriptionEnum.ONE;

  const getUpgradeButton = (): React.ReactNode => {
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
    <div className="divide-y divide-subtle">
      <SettingsHeading
        title={t("project_settings.epics.heading")}
        description={t("project_settings.epics.description")}
      />
      <div
        className={cn("flex flex-col md:flex-row rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-20 font-semibold">Track multi-module, multi-cycle work from one place.</div>
            <div className="text-13 my-6 ">
              Epics are great for housing work that spans several cycles and modules so you can track overall progress
              from one place.
            </div>
            <div className="flex gap-4 flex-wrap">{getUpgradeButton()}</div>
          </div>
        </div>
        <img
          src={resolvedTheme === "dark" ? EpicsUpgradeDark : EpicsUpgradeLight}
          alt="Epics upgrade"
          className="max-h-[320px] self-end flex pb-0 xl:p-0 w-auto"
        />
      </div>
    </div>
  );
});
