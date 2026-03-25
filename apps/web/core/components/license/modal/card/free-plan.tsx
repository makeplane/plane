/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CircleX } from "lucide-react";
// plane constants
import { FREE_PLAN_UPGRADE_FEATURES } from "@plane/constants";
// helpers
import { cn } from "@plane/utils";

type FreePlanCardProps = {
  isOnFreePlan: boolean;
};

export const FreePlanCard = observer(function FreePlanCard(props: FreePlanCardProps) {
  const { isOnFreePlan } = props;
  return (
    <div className="rounded-xl bg-layer-1 px-2 py-4">
      {isOnFreePlan && (
        <div className="px-3 py-2">
          <span className="rounded-sm border border-subtle-1 bg-layer-2 px-2 py-1 text-caption-md-medium text-tertiary">
            Your plan
          </span>
        </div>
      )}
      <div className="px-4 py-2 font-semibold">
        <div className="text-20">Free</div>
        <div className="text-caption-md text-tertiary">$0 per user per month</div>
      </div>
      <div className="px-2 pt-2 pb-3">
        <ul className="grid w-full grid-cols-12 gap-x-4">
          {FREE_PLAN_UPGRADE_FEATURES.map((feature) => (
            <li key={feature} className={cn("relative col-span-12 flex rounded-md p-2")}>
              <p className="flex w-full items-center text-caption-md-medium leading-5">
                <CircleX className="mr-2 size-4 flex-shrink-0 text-danger-secondary" />
                <span className="truncate text-secondary">{feature}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
