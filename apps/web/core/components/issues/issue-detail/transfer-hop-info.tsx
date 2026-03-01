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
import { useParams } from "next/navigation";
// plane imports
import { TransferHopIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { ICycle, TIssue } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

const TransferHistoryItem = observer(function TransferHistoryItem({
  cycleDetails,
  isLast,
}: {
  cycleDetails: ICycle;
  isLast: boolean;
}) {
  return (
    <div className="relative flex items-start gap-3">
      {/* Vertical line */}
      {!isLast && <div className="absolute left-[3px] top-4 bottom-0 w-0.5 bg-layer-3" aria-hidden />}
      {/* Dot indicator */}
      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-layer-3 my-1.5 z-[1]" />
      {/* Content */}
      <div
        className={cn("flex-1 pb-4 truncate", {
          "pb-0": isLast,
        })}
      >
        <p className="text-13 font-medium text-primary truncate">{cycleDetails.name}</p>
        {cycleDetails.start_date && cycleDetails.end_date && (
          <p className="text-11 text-tertiary mt-0.5">
            {renderFormattedDate(cycleDetails.start_date)} - {renderFormattedDate(cycleDetails.end_date)}
          </p>
        )}
      </div>
    </div>
  );
});

export function TransferHopInfo({ workItem }: { workItem: TIssue }) {
  // params
  const { workspaceSlug } = useParams();
  // hooks
  const { getCycleById } = useCycle();
  // derived values
  const isFeatureFlagEnabled = useFlag(workspaceSlug.toString(), "AUTO_SCHEDULE_CYCLES");

  const orderedCycleDetails = workItem.transferred_cycle_ids
    ?.map((cycleId) => getCycleById(cycleId))
    .filter((cycleDetails) => cycleDetails !== null)
    .sort((a, b) => {
      if (!a?.start_date || !b?.start_date) return 0;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });

  const toolTipContent = (
    <div className="space-y-0 p-1">
      {orderedCycleDetails?.map((cycleDetails, index) => (
        <TransferHistoryItem
          key={cycleDetails.id}
          cycleDetails={cycleDetails}
          isLast={index === orderedCycleDetails.length - 1}
        />
      ))}
    </div>
  );

  if (!isFeatureFlagEnabled) return null;
  if (!workItem.transferred_cycle_ids || workItem.transferred_cycle_ids.length === 0) return null;

  return (
    <Tooltip tooltipContent={toolTipContent}>
      <div className="flex items-center gap-1 bg-layer-1 rounded-full px-2 py-1">
        <TransferHopIcon className="size-4" />
        <span className="text-13">{workItem.transferred_cycle_ids.length}</span>
      </div>
    </Tooltip>
  );
}
