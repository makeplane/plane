"use client";

import { observer } from "mobx-react";
// ui
import { StateGroupIcon } from "@plane/ui";
//hooks
import { useStates } from "@/hooks/store";

type Props = {
  stateId: string;
};
export const IssueBlockState = observer(({ stateId }: Props) => {
  const { getStateById } = useStates();

  const state = getStateById(stateId);

  if (!state) return <></>;

  return (
    <div className="flex w-full items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs shadow-sm duration-300 focus:outline-none">
      <div className="flex w-full items-center gap-1.5">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
        <div className="text-xs">{state?.name}</div>
      </div>
    </div>
  );
});
