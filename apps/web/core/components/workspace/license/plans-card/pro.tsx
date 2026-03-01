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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { NewTabIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
// plane web imports
import { PlanCard, SelfManagedLicenseActions } from "@/components/workspace/license";
import { BillingActionsButton } from "@/components/workspace/settings/billing/billing-actions-button";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/services/payment.service";

const paymentService = new PaymentService();

type TProPlanCardProps = {
  upgradeLoader: EProductSubscriptionEnum | null;
  handleUpgrade: (selectedSubscriptionType: EProductSubscriptionEnum) => void;
};

export const ProPlanCard = observer(function ProPlanCard(props: TProPlanCardProps) {
  const { upgradeLoader, handleUpgrade } = props;
  // params
  const { workspaceSlug } = useParams();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    isSubscriptionManagementEnabled,
    getIsInTrialPeriod,
  } = useWorkspaceSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const startDate = subscriptionDetail?.current_period_start_date;
  const endDate = subscriptionDetail?.current_period_end_date;
  const isSubscriptionCancelled = subscriptionDetail?.is_cancelled;
  const isInTrialPeriod = getIsInTrialPeriod(true);

  useEffect(() => {
    setIsLoading(upgradeLoader === EProductSubscriptionEnum.PRO);
  }, [upgradeLoader]);

  const handleSubscriptionPageRedirection = () => {
    setIsLoading(true);
    paymentService
      .getWorkspaceSubscriptionPageLink(workspaceSlug.toString())
      .then((response) => {
        if (response.url) {
          window.open(response.url, "_blank");
        }
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to redirect to subscription page. Please try again.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!subscriptionDetail) return null;

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.PRO}
      planDescription={
        <>
          Unlimited members, 1:5 Guests, Work item types, Active Cycles, and more
          {!subscriptionDetail.is_offline_payment ? (
            <>
              {isInTrialPeriod && (
                <div className={cn(subscriptionDetail.show_trial_banner && "text-danger-secondary")}>
                  Pro trial ends{" "}
                  {subscriptionDetail.remaining_trial_days === 0
                    ? "today"
                    : `in ${subscriptionDetail.remaining_trial_days} days`}{" "}
                  <span>• Billable seats when you upgrade: {subscriptionDetail?.purchased_seats}</span>
                </div>
              )}
              {!isInTrialPeriod &&
                (isSubscriptionCancelled ? (
                  <div>Your billing cycle ends on {renderFormattedDate(endDate)}.</div>
                ) : (
                  <div>
                    {startDate
                      ? `Current billing cycle: ${renderFormattedDate(startDate)} - ${renderFormattedDate(endDate)}`
                      : `Your billing cycle renews on ${renderFormattedDate(endDate)}`}{" "}
                    • Billable seats: {subscriptionDetail?.purchased_seats}
                  </div>
                ))}
            </>
          ) : (
            <div className="text-body-xs-medium text-secondary">
              To manage your subscription, please{" "}
              <a className="text-accent-primary hover:underline" href="mailto:support@plane.so">
                contact support.
              </a>
            </div>
          )}
          <SelfManagedLicenseActions />
        </>
      }
      control={
        isSubscriptionManagementEnabled && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="lg"
              onClick={
                !isSelfManaged && isInTrialPeriod
                  ? () => handleUpgrade(EProductSubscriptionEnum.PRO)
                  : handleSubscriptionPageRedirection
              }
              disabled={isLoading}
              appendIcon={<NewTabIcon />}
            >
              {isLoading ? "Redirecting to Stripe" : isInTrialPeriod ? "Upgrade to Pro" : "Manage subscription"}
            </Button>
            <BillingActionsButton canPerformWorkspaceAdminActions />
          </div>
        )
      }
    />
  );
});
