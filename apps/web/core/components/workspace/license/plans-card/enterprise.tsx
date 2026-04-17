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
import { EProductSubscriptionEnum } from "@plane/types";
// helpers
import { renderFormattedDate } from "@plane/utils";
// plane web imports
import { PlanCard } from "@/components/workspace/license";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const EnterprisePlanCard = observer(function EnterprisePlanCard() {
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const startDate = subscriptionDetail?.current_period_start_date;
  const endDate = subscriptionDetail?.current_period_end_date;
  const isSubscriptionCancelled = subscriptionDetail?.is_cancelled;

  if (!subscriptionDetail) return null;
  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.ENTERPRISE}
      planDescription={
        <>
          Unlimited members, Unlimited Guests, Custom Workflows, Advanced Analytics, and more
          {!subscriptionDetail.is_offline_payment ? (
            <div>
              {isSubscriptionCancelled ? (
                <>Your billing cycle ends on {renderFormattedDate(endDate)}.</>
              ) : (
                <>
                  {startDate
                    ? `Current billing cycle: ${renderFormattedDate(startDate)} - ${renderFormattedDate(endDate)}`
                    : `Your billing cycle renews on ${renderFormattedDate(endDate)}`}{" "}
                  • Billable seats: {subscriptionDetail?.purchased_seats}
                </>
              )}
              <div>To manage your subscription or seats, please contact your instance admin.</div>
            </div>
          ) : (
            <div>
              To manage your subscription, please{" "}
              <a className="text-accent-primary hover:underline" href="mailto:support@plane.so">
                contact support.
              </a>
            </div>
          )}
        </>
      }
    />
  );
});
