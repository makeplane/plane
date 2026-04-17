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
import type { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { getSubscriptionName } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";

type TPlanCard = {
  planVariant: EProductSubscriptionEnum;
  planDescription: React.ReactNode;
  control?: React.ReactNode;
};

export const PlanCard = observer(function PlanCard({ planVariant, planDescription, control }: TPlanCard) {
  const { getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const planName = getSubscriptionName(planVariant);
  const isInTrialPeriod = getIsInTrialPeriod(false);

  return (
    <SettingsBoxedControlItem
      title={planName + (isInTrialPeriod ? " trial" : "")}
      description={planDescription}
      control={control}
    />
  );
});
