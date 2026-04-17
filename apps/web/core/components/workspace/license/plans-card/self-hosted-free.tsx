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
import { EProductSubscriptionEnum } from "@plane/types";
// plane web components
import { PlanCard, SelfManagedLicenseActions } from "@/components/workspace/license";
// plane web hooks
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const SelfHostedFreePlanCard = observer(function SelfHostedFreePlanCard() {
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { toggleLicenseActivationModal } = useSelfHostedSubscription();

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.FREE}
      planDescription={
        <>
          <div>Your Plane license can only be used to unlock features for one workspace.</div>
          <div>Billable seats when you upgrade: {subscriptionDetail?.billable_members}</div>
          <SelfManagedLicenseActions showDeactivateButton={false} />
        </>
      }
      control={
        <Button variant="primary" size="lg" onClick={() => toggleLicenseActivationModal(true)}>
          Activate this workspace
        </Button>
      }
    />
  );
});
