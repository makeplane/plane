"use client";

import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { SUBSCRIPTION_WITH_SEATS_MANAGEMENT } from "@plane/constants";
import { Button, CustomMenu } from "@plane/ui";
// ce imports
import { TBillingActionsButtonProps } from "@/ce/components/workspace/billing/billing-actions-button";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const BillingActionsButton = observer((props: TBillingActionsButtonProps) => {
  const { canPerformWorkspaceAdminActions } = props;
  // store hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    toggleAddWorkspaceSeatsModal,
    toggleRemoveUnusedSeatsConfirmationModal,
  } = useWorkspaceSubscription();
  // derived values
  const isOfflineSubscription = subscriptionDetail?.is_offline_payment;
  const isSeatsManagementEnabled =
    subscriptionDetail &&
    !isOfflineSubscription &&
    SUBSCRIPTION_WITH_SEATS_MANAGEMENT.includes(subscriptionDetail?.product);

  return (
    <>
      {isSeatsManagementEnabled && canPerformWorkspaceAdminActions && (
        <CustomMenu
          customButton={
            <Button variant="neutral-primary" size="sm" className="flex items-center justify-center gap-1">
              Manage seats
              <ChevronDown className="h-3 w-3" />
            </Button>
          }
          placement="bottom-end"
          closeOnSelect
        >
          <CustomMenu.MenuItem
            onClick={() => {
              toggleAddWorkspaceSeatsModal({ isOpen: true });
            }}
          >
            Add seats
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            onClick={() => {
              toggleRemoveUnusedSeatsConfirmationModal();
            }}
          >
            Remove unused seats
          </CustomMenu.MenuItem>
        </CustomMenu>
      )}
    </>
  );
});
