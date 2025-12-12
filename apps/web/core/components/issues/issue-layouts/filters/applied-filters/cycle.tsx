import { observer } from "mobx-react";
import { CloseIcon, CycleGroupIcon } from "@plane/propel/icons";
import type { TCycleGroups } from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// ui
// types

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedCycleFilters = observer(function AppliedCycleFilters(props: Props) {
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
          <div key={cycleId} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11 truncate">
            <CycleGroupIcon cycleGroup={cycleStatus} className="h-3 w-3 flex-shrink-0" />
            <span className="normal-case truncate">{cycleDetails.name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(cycleId)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
