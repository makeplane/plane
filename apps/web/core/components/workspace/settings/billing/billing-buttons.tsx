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
import { Ellipsis } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { NewTabIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
import { AlertModalCore, CustomMenu } from "@plane/ui";
import { getSubscriptionName } from "@plane/utils";
// components
import { SelfManagedSyncButton } from "@/components/workspace/license/plans-card/common/self-managed-sync-button";
import { BillingActionsButton } from "@/components/workspace/settings/billing/billing-actions-button";
// plane web imports
import { useSelfHostedSubscription } from "@/plane-web/hooks/store/use-self-hosted-subscription";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";

type BillingButtonsProps = {
  workspaceSlug: string;
} & (
  | { planVariant: EProductSubscriptionEnum.ONE }
  | {
      planVariant: EProductSubscriptionEnum.BUSINESS | EProductSubscriptionEnum.PRO;
      isLoading: boolean;
      handleManageSeats: () => void;
    }
);

type VariantProps = {
  planVariant: EProductSubscriptionEnum;
  isLoading: boolean;
  isSubscriptionManagementEnabled: boolean;
  handleManageSeats?: () => void;
};

const isPaidPlan = (planVariant: EProductSubscriptionEnum) =>
  planVariant === EProductSubscriptionEnum.PRO || planVariant === EProductSubscriptionEnum.BUSINESS;

const ManageSubscriptionLabel = ({ isLoading }: { isLoading: boolean }) =>
  isLoading ? "Redirecting to Stripe" : "Manage subscription";

const ManageLicenseButton = () => (
  <Button size="lg" variant="primary">
    <a
      href="https://prime.plane.so/"
      className="inline-flex items-center justify-between gap-1 whitespace-nowrap w-full"
      target="_blank"
      rel="noreferrer"
    >
      Manage your license
      <NewTabIcon className="shrink-0 size-4" />
    </a>
  </Button>
);

const CloudBillingButtons = function CloudBillingButtons(props: VariantProps) {
  const { planVariant, isLoading, isSubscriptionManagementEnabled, handleManageSeats } = props;

  if (planVariant === EProductSubscriptionEnum.ONE) return <ManageLicenseButton />;
  if (!isPaidPlan(planVariant) || !isSubscriptionManagementEnabled) return null;

  return (
    <>
      <Button
        size="lg"
        variant="secondary"
        onClick={handleManageSeats}
        disabled={isLoading}
        appendIcon={<NewTabIcon className="shrink-0 size-4" />}
      >
        <ManageSubscriptionLabel isLoading={isLoading} />
      </Button>
      <BillingActionsButton />
    </>
  );
};

type SelfManagedBillingButtonsProps = VariantProps & { onDelink: () => void };

const SelfManagedBillingButtons = function SelfManagedBillingButtons(props: SelfManagedBillingButtonsProps) {
  const { planVariant, isLoading, isSubscriptionManagementEnabled, handleManageSeats, onDelink } = props;

  const showSubscriptionManagement = isPaidPlan(planVariant) && isSubscriptionManagementEnabled;

  return (
    <>
      <SelfManagedSyncButton />
      {showSubscriptionManagement && <BillingActionsButton />}
      {planVariant === EProductSubscriptionEnum.ONE && <ManageLicenseButton />}
      <CustomMenu
        customButton={<Button variant="secondary" size="lg" appendIcon={<Ellipsis />} />}
        placement="bottom-end"
        closeOnSelect
      >
        {showSubscriptionManagement && (
          <CustomMenu.MenuItem onClick={handleManageSeats} className="inline-flex items-center justify-center gap-2">
            <div className="w-full">
              <ManageSubscriptionLabel isLoading={isLoading} />
            </div>
          </CustomMenu.MenuItem>
        )}
        <CustomMenu.MenuItem onClick={onDelink} className="inline-flex items-center justify-center gap-2">
          <div className="w-full text-danger-secondary">Delink license key</div>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </>
  );
};

export const BillingButtons = observer(function BillingButtons(props: BillingButtonsProps) {
  const { workspaceSlug, planVariant } = props;
  const isLoading = "isLoading" in props ? props.isLoading : false;
  const handleManageSeats = "handleManageSeats" in props ? props.handleManageSeats : undefined;

  // states
  const [isDeactivationModalOpen, setIsDeactivationModalOpen] = useState<boolean>(false);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, isSubscriptionManagementEnabled } =
    useWorkspaceSubscription();
  const { deactivateLicense } = useSelfHostedSubscription();

  // derived values
  const isSelfManaged = !!subscriptionDetail?.is_self_managed;
  const planName = subscriptionDetail?.product && getSubscriptionName(subscriptionDetail.product);

  const handleDeactivation = async () => {
    setIsDeactivating(true);
    try {
      await deactivateLicense(workspaceSlug.toString());
      setIsDeactivationModalOpen(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "License deactivated successfully.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to deactivate license. Please try again.",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const variantProps: VariantProps = {
    planVariant,
    isLoading,
    isSubscriptionManagementEnabled,
    handleManageSeats,
  };

  return (
    <div className="flex items-center gap-2.5">
      {isSelfManaged && (
        <AlertModalCore
          handleClose={() => setIsDeactivationModalOpen(false)}
          handleSubmit={handleDeactivation}
          isSubmitting={isDeactivating}
          isOpen={isDeactivationModalOpen}
          title="Delink license key"
          content={
            <>
              All <span className="font-medium">{planName}</span> features will stop working when you do this. Proceed
              to reactivate this workspace with another license key or downgrade to the Free plan.
            </>
          }
          secondaryButtonText="Cancel"
          primaryButtonText={{
            loading: "Delinking",
            default: "Delink",
          }}
        />
      )}
      {isSelfManaged ? (
        <SelfManagedBillingButtons {...variantProps} onDelink={() => setIsDeactivationModalOpen(true)} />
      ) : (
        <CloudBillingButtons {...variantProps} />
      )}
    </div>
  );
});
