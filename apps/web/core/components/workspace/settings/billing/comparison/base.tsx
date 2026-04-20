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
import { cn, getBaseSubscriptionName, shouldRenderPlanDetail } from "@plane/utils";
// constants
import { PLANE_PLANS } from "@/constants/plans";
// local imports
import { CheckIcon } from "@plane/propel/icons";

type PlansComparisonBaseProps = { planeDetails: React.ReactNode; showHeadColumn: boolean };

export const PlansComparisonBase = function PlansComparisonBase(props: PlansComparisonBaseProps) {
  const { planeDetails, showHeadColumn } = props;
  // plan details
  const { planDetails, planHighlights } = PLANE_PLANS;
  const numberOfPlansToRender = Object.keys(planDetails).filter((planKey) =>
    shouldRenderPlanDetail(planKey as EProductSubscriptionEnum)
  ).length;

  const gridColumns = showHeadColumn ? numberOfPlansToRender + 1 : numberOfPlansToRender;

  return (
    <div className="size-full overflow-x-auto horizontal-scrollbar scrollbar-sm">
      <div className="max-w-full bg-layer-1 rounded-xl" style={{ minWidth: `${numberOfPlansToRender * 280}px` }}>
        <div className="h-full flex flex-col">
          <div
            className={cn(
              "shrink-0 sticky z-10 bg-layer-2 grid gap-3 text-caption-md-medium rounded-xl border border-subtle"
            )}
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            }}
          >
            {showHeadColumn && <div className="col-span-1 p-4 text-h6-medium text-primary">Features</div>}
            {planeDetails}
          </div>
          {/* Plan Headers */}
          <section className="shrink-0">
            {/* Plan Highlights */}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
              {showHeadColumn && <div className="col-span-1 p-4 text-h6-medium text-primary">Highlights</div>}
              {Object.entries(planHighlights).map(
                ([planKey, highlights]) =>
                  shouldRenderPlanDetail(planKey as EProductSubscriptionEnum) && (
                    <div key={planKey} className="col-span-1 px-6 py-4 space-y-3">
                      <h6 className="text-h6-medium">
                        Everything in {getBaseSubscriptionName(planKey as EProductSubscriptionEnum)} +
                      </h6>
                      <ul className="list-none space-y-3 text-body-xs-regular">
                        {highlights.map((highlight, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckIcon className="size-4 shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
