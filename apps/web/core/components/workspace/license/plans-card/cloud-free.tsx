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
import { Loader as LoaderIcon } from "lucide-react";
import { Button } from "@plane/propel/button";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { Loader } from "@plane/ui";
import { getSubscriptionName } from "@plane/utils";
// plane web components
import { PlanCard } from "@/components/workspace/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TCloudFreePlanCardProps = {
  upgradeProductType: EProductSubscriptionEnum;
  isProductsAPILoading: boolean;
  trialLoader: EProductSubscriptionEnum | null;
  upgradeLoader: EProductSubscriptionEnum | null;
  handleTrial: (selectedSubscriptionType: EProductSubscriptionEnum) => void;
  handleUpgrade: (selectedSubscriptionType: EProductSubscriptionEnum) => void;
};

export const CloudFreePlanCard = observer(function CloudFreePlanCard(props: TCloudFreePlanCardProps) {
  const { upgradeProductType, isProductsAPILoading, trialLoader, upgradeLoader, handleTrial, handleUpgrade } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const upgradeProductName = getSubscriptionName(upgradeProductType);

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.FREE}
      planDescription={
        <>
          <div>12 members, unlimited projects, work items, cycles, modules, and pages</div>
          <div>Billable seats when you upgrade: {subscriptionDetail?.billable_members}</div>
        </>
      }
      control={
        <div className="flex items-center justify-center gap-2">
          {isProductsAPILoading ? (
            <Loader className="w-32">
              <Loader.Item height="30px" width="100%" />
            </Loader>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-fit"
              tabIndex={-1}
              onClick={() => handleUpgrade(upgradeProductType)}
              disabled={!!upgradeLoader}
            >
              {upgradeLoader === upgradeProductType ? "Redirecting to Stripe" : `Upgrade to ${upgradeProductName}`}
            </Button>
          )}
          {subscriptionDetail?.is_trial_ended && (
            <div className="px-2 text-center text-caption-sm-medium text-danger-secondary">Trial ended</div>
          )}
          {subscriptionDetail?.is_trial_allowed && (
            <>
              {isProductsAPILoading ? (
                <Loader className="w-28">
                  <Loader.Item height="30px" width="100%" />
                </Loader>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => handleTrial(upgradeProductType)}
                    disabled={!!trialLoader}
                  >
                    {trialLoader === upgradeProductType && (
                      <div className="w-3 h-3">
                        <LoaderIcon size={12} className="animate-spin" />
                      </div>
                    )}
                    <span>Start free trial</span>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      }
    />
  );
});
