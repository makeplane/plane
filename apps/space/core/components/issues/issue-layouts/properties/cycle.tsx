import { observer } from "mobx-react";
// plane ui
import { CycleIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// plane utils
import { cn } from "@plane/utils";
//hooks
import { useCycle } from "@/hooks/store/use-cycle";

type Props = {
  cycleId: string | undefined;
  shouldShowBorder?: boolean;
};

export const IssueBlockCycle = observer(function IssueBlockCycle({ cycleId, shouldShowBorder = true }: Props) {
  const { getCycleById } = useCycle();

  const cycle = getCycleById(cycleId);

  return (
    <Tooltip tooltipHeading="Cycle" tooltipContent={cycle?.name ?? "No Cycle"}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-between gap-1 rounded-sm px-2.5 py-1 text-11  duration-300 focus:outline-none",
          { "border-[0.5px] border-strong": shouldShowBorder }
        )}
      >
        <div className="flex w-full items-center text-11 gap-1.5">
          <CycleIcon className="h-3 w-3 flex-shrink-0" />
          <div className="max-w-40 truncate ">{cycle?.name ?? "No Cycle"}</div>
        </div>
      </div>
    </Tooltip>
  );
});
