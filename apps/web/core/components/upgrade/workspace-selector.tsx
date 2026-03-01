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

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane imports
import type { EExternalUpgradePlanType } from "@plane/constants";
import { EExternalUpgradeEditionType, EProductSubscriptionTier } from "@plane/constants";
import { InfoIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TWorkspaceWithProductDetails } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { Button, getButtonStyling } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import { Tooltip } from "@plane/propel/tooltip";
import {
  cn,
  getEditionUpgradePath,
  getSubscriptionName,
  getSubscriptionTypeFromExternalUpgradePlanTypeEnum,
  truncateText,
} from "@plane/utils";
// components
import { RadioInput } from "@/components/estimates/radio-select";
// hooks
import { useUser } from "@/hooks/store/user/user-user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type WorkspaceSelectorProps = {
  planType: EExternalUpgradePlanType;
};

export const WorkspaceSelector = observer(({ planType }: WorkspaceSelectorProps) => {
  // router
  const router = useAppRouter();
  // next themes
  const { setTheme } = useTheme();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  // hooks
  const { data: currentUser, signOut } = useUser();
  // derived values
  const subscriptionType = getSubscriptionTypeFromExternalUpgradePlanTypeEnum(planType);
  const subscriptionName = getSubscriptionName(subscriptionType);

  const { data: workspacesList, isLoading: isFetching } = useSWR(
    currentUser ? `CLOUD_WORKSPACES_LIST` : null,
    currentUser ? () => workspaceService.getWorkspacesWithPlanDetails() : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  const isAnyWorkspaceAvailable = workspacesList && workspacesList?.length > 0;

  const handleNextStep = () => {
    router.push(`${getEditionUpgradePath(planType, EExternalUpgradeEditionType.CLOUD)}/${selectedWorkspace}`);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut()
      .then(() => {
        setTheme("system");
        router.push("/");
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      )
      .finally(() => setIsLoading(false));
  };

  const getLabel = () => {
    const containerClassName = "flex flex-col items-center gap-2 pb-4";
    const titleClassName = "text-center text-h4-semibold pb-1";
    const descriptionClassName = "text-center text-body-xs-regular text-tertiary";
    const infoClassName =
      "flex gap-2 text-body-xs-regular text-secondary bg-layer-3 rounded-md mt-2 p-3 border border-strong shadow-raised-100";

    if (isAnyWorkspaceAvailable) {
      return (
        <div className={containerClassName}>
          <div className={titleClassName}>Choose your workspace</div>
          <div className={descriptionClassName}>We found the following workspaces eligible for {subscriptionName}.</div>
          <div className={infoClassName}>
            <InfoIcon className="size-3.5 mt-0.5 shrink-0" />
            If you want to upgrade a different workspace, log in with that email and make sure you are an admin of the
            workspace you want to upgrade.
          </div>
        </div>
      );
    }

    return (
      <div className={containerClassName}>
        <div className={titleClassName}>
          We didn&apos;t find an eligible workspace for this upgrade. Try another email address.
        </div>
        <div className={descriptionClassName}>We couldn&apos;t find any {subscriptionName} eligible workspace.</div>
        <div className={infoClassName}>
          <InfoIcon className="size-3.5 mt-0.5 shrink-0" />
          Try a different email address and make sure you are an admin of the workspace you want to upgrade.
        </div>
      </div>
    );
  };

  const getTooltipContent = (workspace: TWorkspaceWithProductDetails) => {
    const isSubscriptionActive = workspace.product !== EProductSubscriptionEnum.FREE;
    const isOnTrial = workspace.is_on_trial;

    // Fallback case, this should never happen as tooltip is only shown for active subscriptions
    if (!isSubscriptionActive) {
      return `This workspace is eligible for upgrade.`;
    }

    // If the workspace is on trial, show a tooltip with the trial information
    if (isOnTrial && !workspace.has_added_payment_method) {
      return `You are trialing ${getSubscriptionName(workspace.product)} in this workspace. Consider upgrading it to ${subscriptionName} before your trial runs out.`;
    }

    // If the workspace is already subscribed to the same subscription type, show a tooltip with the subscription information
    let tooltipContent = `This workspace is already subscribed to ${getSubscriptionName(workspace.product)}.`;

    // If the workspace is subscribed to a lower tier, show a tooltip with the upgrade information
    if (EProductSubscriptionTier[subscriptionType] > EProductSubscriptionTier[workspace.product]) {
      tooltipContent += ` Consider upgrading it to ${subscriptionName}, ${isOnTrial && "once your trial ends"} to unlock more features.`;
    }

    return tooltipContent;
  };

  const isUpgradeEnabled = (workspace: TWorkspaceWithProductDetails) => {
    // If the workspace is on trial, allow upgrade if the user has not added a payment method
    if (workspace.is_on_trial) {
      return !workspace.has_added_payment_method;
    }

    // If the workspace is subscribed to a lower tier, allow upgrade
    if (EProductSubscriptionTier[subscriptionType] > EProductSubscriptionTier[workspace.product]) {
      return true;
    }

    return false;
  };

  if (isFetching) {
    return (
      <Loader className="w-full h-full flex flex-col gap-4">
        <Loader.Item height="40px" />
        <Loader.Item height="80px" />
        <Loader.Item height="280px" className="mt-4" />
      </Loader>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <RadioInput
        name="workspace-upgrade-radio-input"
        label={getLabel()}
        options={
          isAnyWorkspaceAvailable
            ? workspacesList.map((workspace) => {
                const isOnTrial = workspace.is_on_trial;
                const isSubscriptionActive = workspace.product !== EProductSubscriptionEnum.FREE;
                const isSubscriptionOrTrialActive = isSubscriptionActive || isOnTrial;
                const workspaceSubscriptionName = getSubscriptionName(workspace.product);
                return {
                  label: (
                    <div className={`flex items-center gap-3 pl-1`}>
                      <div className="shrink-0">
                        <div className="relative grid h-7 w-7 place-items-center rounded">
                          {workspace?.logo && workspace.logo !== "" ? (
                            <img
                              src={workspace.logo}
                              className="absolute left-0 top-0 h-full w-full rounded object-cover"
                              alt={workspace.name}
                            />
                          ) : (
                            <span className="grid h-7 w-7 justify-center place-items-center rounded bg-layer-3 px-3 py-1.5 uppercase text-body-xs-medium text-white">
                              {workspace?.name[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-body-xs-medium">{truncateText(workspace?.name, 40)}</div>
                      </div>
                      {isSubscriptionOrTrialActive && (
                        <div className="shrink-0">
                          <Tooltip position="right" tooltipContent={getTooltipContent(workspace)}>
                            <div className="rounded px-1.5 py-[1px] text-center text-caption-sm-medium outline-none text-plans-brand-primary bg-plans-brand-subtle">
                              {workspaceSubscriptionName}
                              {isOnTrial ? " trial" : ""}
                            </div>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  ),
                  value: workspace.slug,
                  disabled: !isUpgradeEnabled(workspace),
                };
              })
            : []
        }
        className="w-full"
        wrapperClassName={cn({
          "w-full max-h-72 overflow-auto vertical-scrollbar scrollbar-xs flex flex-col gap-5 p-5 border border-strong shadow-raised-100 rounded-md bg-layer-2":
            isAnyWorkspaceAvailable,
        })}
        buttonClassName="size-3.5 mt-0.5"
        selected={selectedWorkspace}
        onChange={(value) => setSelectedWorkspace(value)}
      />
      {isAnyWorkspaceAvailable ? (
        <Button
          className="mt-6 w-full"
          size="xl"
          onClick={handleNextStep}
          loading={isLoading}
          disabled={isLoading || !selectedWorkspace}
        >
          {isLoading ? "Going to payment" : "Choose billing frequency"}
        </Button>
      ) : (
        <div className="w-full flex gap-4 px-4">
          <Button className="w-full px-2" size="lg" onClick={handleSignOut} loading={isLoading} disabled={isLoading}>
            Try another email address
          </Button>
          <Link href="/create-workspace" className={cn(getButtonStyling("secondary", "lg"))}>
            Create a new workspace
          </Link>
        </div>
      )}
    </div>
  );
});
