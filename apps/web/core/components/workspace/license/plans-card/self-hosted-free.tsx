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
import { PlanCard } from "@/components/workspace/license";
import { SelfManagedSyncButton } from "@/components/workspace/license/plans-card/common/self-managed-sync-button";
// plane web hooks
import { useSelfHostedSubscription } from "@/plane-web/hooks/store";

export const SelfHostedFreePlanCard = observer(function SelfHostedFreePlanCard() {
  // hooks
  const { toggleLicenseActivationModal } = useSelfHostedSubscription();

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.FREE}
      control={
        <div className="flex items-center gap-2.5">
          <SelfManagedSyncButton />
          <Button variant="primary" size="lg" onClick={() => toggleLicenseActivationModal(true)}>
            Activate this workspace
          </Button>
        </div>
      }
    />
  );
});
