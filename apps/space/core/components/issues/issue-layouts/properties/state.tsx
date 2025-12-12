import { observer } from "mobx-react";
// plane ui
import { StateGroupIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TStateGroups } from "@plane/types";
// plane utils
import { cn } from "@plane/utils";
//hooks
import { useStates } from "@/hooks/store/use-state";

type Props = {
  shouldShowBorder?: boolean;
} & (
  | {
      stateDetails: {
        name: string;
        group: TStateGroups;
      };
    }
  | {
      stateId: string;
    }
);

export const IssueBlockState = observer(function IssueBlockState(props: Props) {
  const { shouldShowBorder = true } = props;
  // store hooks
  const { getStateById } = useStates();
  // derived values
  const state = "stateId" in props ? getStateById(props.stateId) : props.stateDetails;
  if (!state) return null;

  return (
    <Tooltip tooltipHeading="State" tooltipContent={state.name}>
      <div
        className={cn("flex h-full w-full items-center justify-between gap-1 rounded-sm px-2.5 py-1 text-11", {
          "border-[0.5px] border-strong": shouldShowBorder,
        })}
      >
        <div className="flex w-full items-center gap-1.5">
          <StateGroupIcon stateGroup={state.group} />
          <div className="text-11">{state.name}</div>
        </div>
      </div>
    </Tooltip>
  );
});
