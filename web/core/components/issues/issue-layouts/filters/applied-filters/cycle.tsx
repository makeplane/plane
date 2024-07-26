"use client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
import { TCycleGroups } from "@plane/types";
// hooks
import { CycleGroupIcon } from "@plane/ui";
import { useCycle } from "@/hooks/store";
// ui
// types

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedCycleFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;
  // store hooks
  const { getCycleById } = useCycle();

  return (
    <>
      {values.map((cycleId) => {
        const cycleDetails = getCycleById(cycleId) ?? null;

        if (!cycleDetails) return null;

        const cycleStatus = (cycleDetails?.status ? cycleDetails?.status.toLocaleLowerCase() : "draft") as TCycleGroups;

        return (
          <div key={cycleId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs truncate">
            <CycleGroupIcon cycleGroup={cycleStatus} className="h-3 w-3 flex-shrink-0" />
            <span className="normal-case truncate">{cycleDetails.name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(cycleId)}
              >
                <X size={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
