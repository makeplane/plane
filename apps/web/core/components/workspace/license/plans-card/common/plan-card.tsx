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
import { Badge } from "@plane/propel/badge";
import { cn, getSubscriptionName } from "@plane/utils";
// components
import { PlanDetails, SelfManagedLicenseActions } from "@/components/workspace/license";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TPlanCard = {
  planVariant: EProductSubscriptionEnum;
  planDescription?: React.ReactNode;
  showSelfManagedLicenseActions?: boolean;
  control?: React.ReactNode;
};

export const PlanCard = observer(function PlanCard({
  planVariant,
  planDescription,
  showSelfManagedLicenseActions = false,
  control,
}: TPlanCard) {
  const { getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const planName = getSubscriptionName(planVariant);
  const isInTrialPeriod = getIsInTrialPeriod(true);
  const isFreePlan = planVariant === EProductSubscriptionEnum.FREE;

  return (
    <div>
      <div
        className={cn(
          "w-full bg-layer-2 rounded-lg border border-subtle px-4 py-3 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 md:gap-8",
          isFreePlan ? "" : "rounded-b-none"
        )}
      >
        <div className="flex flex-col gap-1.5">
          <h4 className="flex items-center gap-1.5 text-body-sm-medium text-primary">
            {planName} {isInTrialPeriod ? "trial" : ""} <Badge variant="brand">Current</Badge>
          </h4>
          {planDescription && <p className="text-caption-md-regular text-tertiary">{planDescription}</p>}
          {showSelfManagedLicenseActions && <SelfManagedLicenseActions showDeactivateButton={!isFreePlan} />}
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>

      {!isFreePlan && <PlanDetails />}
    </div>
  );
});
