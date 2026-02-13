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
// ce imports
import type { TAppFeaturesTourProps } from "@/components/onboarding/tour/app-features";
import { AppFeaturesTourRoot } from "@/components/onboarding/tour/app-features";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { BusinessPlanFeatures } from "./business-plan-features";
import { EProductSubscriptionEnum } from "@plane/types";

export const TourRoot = observer(function TourRoot(props: TAppFeaturesTourProps) {
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfHosted = !!subscriptionDetail?.is_self_managed;
  const isOnBusinessPlan = subscriptionDetail?.product === EProductSubscriptionEnum.BUSINESS;

  if (!isSelfHosted && isOnBusinessPlan && subscriptionDetail.is_on_trial) {
    return <BusinessPlanFeatures onComplete={props.onComplete} />;
  }

  return <AppFeaturesTourRoot onComplete={props.onComplete} />;
});
