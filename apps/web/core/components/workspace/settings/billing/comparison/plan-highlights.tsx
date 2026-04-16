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
import type { EProductSubscriptionEnum } from "@plane/types";
import { cn, getBaseSubscriptionName } from "@plane/utils";
import { CheckIcon } from "@plane/propel/icons";
// constants
import { PLANE_PLANS } from "@/constants/plans";

type PlanHighlightsProps = { upgradePlans: EProductSubscriptionEnum[]; isHorizontalView?: boolean };

export const PlanHighlights = function PlanHighlights(props: PlanHighlightsProps) {
  const { upgradePlans, isHorizontalView = false } = props;
  const { planHighlights } = PLANE_PLANS;

  return (
    <>
      {upgradePlans.map((planId) => {
        const highlights = planHighlights[planId];
        return (
          <div key={planId} className="col-span-1 px-6 py-4">
            <div className={cn("flex gap-3", isHorizontalView ? "flex-wrap" : "flex-col justify-between")}>
              <h6 className={cn("text-h6-medium", isHorizontalView && "w-full mb-4")}>
                Everything in {getBaseSubscriptionName(planId)} +
              </h6>

              {highlights.map((highlight, index) => (
                <p
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    index === 0 ? "text-body-xs-medium text-accent-primary" : "text-body-xs-regular"
                  )}
                >
                  <CheckIcon className="size-4 shrink-0" />
                  {highlight}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};
