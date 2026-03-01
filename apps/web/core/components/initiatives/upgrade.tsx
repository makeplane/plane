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
import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
import { Button, getButtonStyling } from "@plane/propel/button";
import { setPromiseToast } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// assets
import InitiativesUpgradeDark from "@/app/assets/empty-state/initiatives/upgrade-dark.webp";
import InitiativesUpgradeLight from "@/app/assets/empty-state/initiatives/upgrade-light.webp";
// hooks
import { useFlag, useWorkspaceFeatures, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";

type Props = {
  workspaceSlug: string;
  redirect?: boolean;
};

export const InitiativesUpgrade = observer(function InitiativesUpgrade(props: Props) {
  const { workspaceSlug, redirect = false } = props;
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // store hooks
  const { resolvedTheme } = useTheme();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();

  // derived values
  const isInitiativesFeatureFlagEnabled = useFlag(workspaceSlug, "INITIATIVES");
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED);
  const isPlaneOneInstance =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product === EProductSubscriptionEnum.ONE;

  // handlers
  const handleEnableInitiatives = async () => {
    try {
      setIsLoading(true);
      const payload = {
        [EWorkspaceFeatures.IS_INITIATIVES_ENABLED]: true,
      };
      const toggleInitiativesFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
      setPromiseToast(toggleInitiativesFeaturePromise, {
        loading: "Updating initiatives feature...",
        success: {
          title: "Success",
          message: () => `Initiatives feature ${isInitiativesFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update initiatives feature!",
        },
      });
      await toggleInitiativesFeaturePromise;
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const getUpgradeButton = () => {
    if (isInitiativesFeatureFlagEnabled) {
      return redirect ? (
        <a href={`/${workspaceSlug}/settings/initiatives/`} className={getButtonStyling("primary", "base")}>
          Enable
        </a>
      ) : (
        <Button disabled={isLoading} onClick={() => handleEnableInitiatives()}>
          Enable
        </Button>
      );
    }

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
    <div className="">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-20 font-semibold">Track all your projects from one screen.</div>
            <div className="text-13">
              Group projects like you group work items by state, priority, or any other—and track their progress in one
              click.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {getUpgradeButton()}
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
          src={resolvedTheme === "dark" ? InitiativesUpgradeDark : InitiativesUpgradeLight}
          alt="Initiatives upgrade"
          className="max-h-[300px] w-auto self-end flex p-5 pb-0 xl:p-0 object-contain"
        />
      </div>
    </div>
  );
});
