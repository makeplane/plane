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
// plane imports
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomMenu } from "@plane/ui";
import { EProductSubscriptionEnum } from "@plane/types";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useParams } from "next/navigation";

export const BillingActionsButton = observer(function BillingActionsButton() {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { permissions: workspacePermissions } = useWorkspace();
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    isSeatManagementEnabled,
    toggleAddWorkspaceSeatsModal,
    toggleRemoveUnusedSeatsConfirmationModal,
  } = useWorkspaceSubscription();
  // derived values
  const canManageSeats = workspaceSlug ? workspacePermissions.getCanManageBilling(workspaceSlug) : false;
  const isOnEnterprisePlan = subscriptionDetail?.product === EProductSubscriptionEnum.ENTERPRISE;

  if (!isSeatManagementEnabled || !canManageSeats || isOnEnterprisePlan) return null;
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
