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
import { cn } from "@plane/utils";
// local imports
import { PlanHighlights } from "./plan-highlights";

type PlansComparisonBaseProps = {
  upgradePlans: EProductSubscriptionEnum[];
  isHorizontalView: boolean;
  planeDetails: React.ReactNode;
  showHeadColumn: boolean;
};

export const PlansComparisonBase = function PlansComparisonBase(props: PlansComparisonBaseProps) {
  const { upgradePlans, planeDetails, isHorizontalView, showHeadColumn } = props;

  const numberOfPlansToRender = upgradePlans.length;

  if (isHorizontalView) {
    return (
      <div className="w-full max-w-full bg-layer-1 rounded-xl">
        <div className="overflow-hidden rounded-xl border border-subtle">
          <div className="bg-layer-2">{planeDetails}</div>

          <PlanHighlights upgradePlans={upgradePlans} isHorizontalView={isHorizontalView} />
        </div>
      </div>
    );
  }

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
              <PlanHighlights upgradePlans={upgradePlans} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
