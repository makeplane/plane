import { observer } from "mobx-react-lite";

// icons
import { StateGroupIcon } from "@plane/ui";
import { X } from "lucide-react";
// types
import { IState } from "types";

type Props = {
  handleRemove: (val: string) => void;
  states: IState[];
  values: string[];
};

export const AppliedStateFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, states, values } = props;

  return (
    <>
      {values.map((stateId) => {
        const stateDetails = states?.find((s) => s.id === stateId);

        if (!stateDetails) return null;

        return (
          <div key={stateId} className="text-xs flex items-center gap-1 bg-custom-background-80 p-1 rounded">
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
