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
// plane imports
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { SettingsHeading } from "@/components/settings/heading";
import {
  CloudFreePlanCard,
  OnePlanCard,
  ProPlanCard,
  BusinessPlanCard,
  SelfHostedFreePlanCard,
  EnterprisePlanCard,
} from "@/components/workspace/license";
import { BusinessTrialBanner } from "@/components/get-started/widgets";
import { PlanUpgrade } from "@/components/workspace/settings/billing/comparison/plan-upgrade";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type BillingRootProps = { workspaceSlug: string };

export const BillingRoot = observer(function BillingRoot({ workspaceSlug }: BillingRootProps) {
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { t } = useTranslation();

  // derived values
  const isEnterprise = subscriptionDetail?.product === EProductSubscriptionEnum.ENTERPRISE;

  return (
    <section className="relative size-full overflow-y-auto scrollbar-hide">
      <div>
        <SettingsHeading
          title={t("workspace_settings.settings.billing_and_plans.heading")}
          description={t("workspace_settings.settings.billing_and_plans.description")}
        />
        <div className="mt-6 flex flex-col gap-3">
          <BusinessTrialBanner variant="compact" />
          {subscriptionDetail ? (
            <>
              {subscriptionDetail.product === EProductSubscriptionEnum.FREE &&
                (subscriptionDetail.is_self_managed ? <SelfHostedFreePlanCard /> : <CloudFreePlanCard />)}
              {subscriptionDetail.product === EProductSubscriptionEnum.ONE && <OnePlanCard />}
              {subscriptionDetail.product === EProductSubscriptionEnum.PRO && <ProPlanCard />}
              {subscriptionDetail.product === EProductSubscriptionEnum.BUSINESS && <BusinessPlanCard />}
              {subscriptionDetail.product === EProductSubscriptionEnum.ENTERPRISE && <EnterprisePlanCard />}
            </>
          ) : (
            <Loader className="flex w-full justify-between">
              <Loader.Item height="30px" width="40%" />
              <Loader.Item height="30px" width="20%" />
            </Loader>
          )}
        </div>
      </div>

      {!isEnterprise && (
        <PlanUpgrade
          workspaceSlug={workspaceSlug}
          heading={<div className="text-h6-medium self-center">Upgrade</div>}
          showHeadColumn
        />
      )}
    </section>
  );
});
