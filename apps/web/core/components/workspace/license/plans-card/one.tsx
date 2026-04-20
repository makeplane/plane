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

// plane imports
import { EProductSubscriptionEnum } from "@plane/types";
// plane web components
import { PlanCard } from "@/components/workspace/license";
import { BillingButtons } from "@/components/workspace/settings/billing/billing-buttons";

type OnePlanCardProps = {
  workspaceSlug: string;
};

export const OnePlanCard = function OnePlanCard(props: OnePlanCardProps) {
  const { workspaceSlug } = props;

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.ONE}
      control={<BillingButtons workspaceSlug={workspaceSlug} planVariant={EProductSubscriptionEnum.ONE} />}
    />
  );
};
