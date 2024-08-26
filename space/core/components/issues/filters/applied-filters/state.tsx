"use client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
// ui
import { StateGroupIcon } from "@plane/ui";
// hooks
import { useStates } from "@/hooks/store";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedStateFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  const { sortedStates: states } = useStates();

  return (
    <>
      {values.map((stateId) => {
        const stateDetails = states?.find((s) => s.id === stateId);

        if (!stateDetails) return null;

        return (
          <div key={stateId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <StateGroupIcon color={stateDetails.color} stateGroup={stateDetails.group} height="12px" width="12px" />
            {stateDetails.name}
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemove(stateId)}
            >
              <X size={10} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </>
  );
});
