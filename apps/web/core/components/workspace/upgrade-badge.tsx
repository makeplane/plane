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

import type { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { E_FEATURE_FLAGS } from "@plane/constants";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";
// store
import { useFeatureFlags, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
  flag?: keyof typeof E_FEATURE_FLAGS;
};

export const UpgradeBadge = observer(function UpgradeBadge(props: TUpgradeBadge) {
  const { className, size = "sm", flag } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  const { getFeatureFlag } = useFeatureFlags();
  // derived values
  const isFeatureEnabled = flag ? getFeatureFlag(workspaceSlug?.toString(), flag, false) : false;
  const isSubscribedToPro = currentWorkspaceSubscribedPlanDetail?.product === EProductSubscriptionEnum.PRO;

  if (!currentWorkspaceSubscribedPlanDetail || isFeatureEnabled || isSubscribedToPro) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-fit cursor-pointer rounded-2xl text-accent-secondary bg-accent-primary/20 text-center font-medium outline-none",
        {
          "text-13 px-3": size === "md",
          "text-11 px-2": size === "sm",
        },
        className
      )}
    >
      Pro
    </div>
  );
});
