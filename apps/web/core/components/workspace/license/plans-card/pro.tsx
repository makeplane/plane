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
import { EProductSubscriptionEnum } from "@plane/types";
// components
import { PlanCard } from "@/components/workspace/license";
import { BillingActionsButton } from "@/components/workspace/settings/billing/billing-actions-button";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const ProPlanCard = observer(function ProPlanCard() {
  // hooks
  const { isSubscriptionManagementEnabled } = useWorkspaceSubscription();

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.PRO}
      showSelfManagedLicenseActions
      control={isSubscriptionManagementEnabled && <BillingActionsButton canPerformWorkspaceAdminActions />}
    />
  );
});
