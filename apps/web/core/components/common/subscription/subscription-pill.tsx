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
import { observer } from "mobx-react";
import type { IWorkspace } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn, getSubscriptionName } from "@plane/utils";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

// In case workspace is not passed, we will use the current workspace's subscription detail from the store
type TProps = { workspace?: IWorkspace };

export const SubscriptionPill = observer(function SubscriptionPill(props: TProps) {
  const { workspace } = props;
  //hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const subscriptionName = getSubscriptionName(
    workspace?.current_plan ?? subscriptionDetail?.product ?? EProductSubscriptionEnum.FREE
  );
  const isOnFreePlan = workspace?.current_plan === EProductSubscriptionEnum.FREE;
  const isOnTrial = workspace ? workspace?.is_on_trial : getIsInTrialPeriod(false);

  return (
    <div
      className={cn("rounded-sm px-1.5 py-1 text-caption-sm-medium", {
        "bg-plans-brand-subtle text-plans-brand-primary": !isOnFreePlan,
        "bg-plans-neutral-subtle text-plans-neutral-primary": isOnFreePlan,
      })}
    >
      <h1>
        {subscriptionName}
        {isOnTrial && " trial"}
      </h1>
    </div>
  );
});
