"use client";

import { observer } from "mobx-react";
// plane ui
import { StateGroupIcon, Tooltip } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
//hooks
import { useStates } from "@/hooks/store";

type Props = {
  stateId: string | undefined;
  shouldShowBorder?: boolean;
};
export const IssueBlockState = observer(({ stateId, shouldShowBorder = true }: Props) => {
  const { getStateById } = useStates();

  const state = getStateById(stateId);

  return (
    <Tooltip tooltipHeading="State" tooltipContent={state?.name ?? "State"}>
      <div
        className={cn("flex h-full w-full items-center justify-between gap-1 rounded px-2.5 py-1 text-xs", {
          "border-[0.5px] border-custom-border-300": shouldShowBorder,
        })}
      >
        <div className="flex w-full items-center gap-1.5">
          <StateGroupIcon stateGroup={state?.group ?? "backlog"} color={state?.color} />
          <div className="text-xs">{state?.name ?? "State"}</div>
        </div>
      </div>
    </Tooltip>
  );
});
