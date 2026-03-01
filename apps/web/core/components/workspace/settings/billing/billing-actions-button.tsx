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
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
// plane imports
import { CustomMenu } from "@plane/ui";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { EProductSubscriptionEnum } from "@plane/types";

type TBillingActionsButtonProps = {
  canPerformWorkspaceAdminActions: boolean;
};

export const BillingActionsButton = observer(function BillingActionsButton(props: TBillingActionsButtonProps) {
  const { canPerformWorkspaceAdminActions } = props;
  // store hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    isSeatManagementEnabled,
    toggleAddWorkspaceSeatsModal,
    toggleRemoveUnusedSeatsConfirmationModal,
  } = useWorkspaceSubscription();
  // derived values
  const isOnEnterprisePlan = subscriptionDetail?.product === EProductSubscriptionEnum.ENTERPRISE;

  if (!isSeatManagementEnabled || !canPerformWorkspaceAdminActions || isOnEnterprisePlan) return null;
  return (
    <CustomMenu
      customButton={
        <Button variant="secondary" size="lg" appendIcon={<ChevronDownIcon />}>
          Manage seats
        </Button>
      }
      placement="bottom-end"
      disabled={isOnEnterprisePlan}
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
  );
});
