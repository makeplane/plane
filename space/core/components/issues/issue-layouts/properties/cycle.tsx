"use client";

import { observer } from "mobx-react";
// ui
import { cn } from "@plane/editor";
import { ContrastIcon, Tooltip } from "@plane/ui";
//hooks
import { useCycle } from "@/hooks/store/use-cycle";

type Props = {
  cycleId: string | undefined;
  shouldShowBorder?: boolean;
};

export const IssueBlockCycle = observer(({ cycleId, shouldShowBorder = true }: Props) => {
  const { getCycleById } = useCycle();

  const cycle = getCycleById(cycleId);

  return (
    <Tooltip tooltipHeading="Cycle" tooltipContent={cycle?.name ?? "No Cycle"}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-between gap-1 rounded px-2.5 py-1 text-xs  duration-300 focus:outline-none",
          { "border-[0.5px] border-custom-border-300": shouldShowBorder }
        )}
      >
        <div className="flex w-full items-center text-xs gap-1.5">
          <ContrastIcon className="h-3 w-3 flex-shrink-0" />
          <div className="max-w-40 flex-grow truncate ">{cycle?.name ?? "No Cycle"}</div>
        </div>
      </div>
    </Tooltip>
  );
});
