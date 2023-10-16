import { observer } from "mobx-react-lite";

// icons
import { StateGroupIcon } from "components/icons";
import { X } from "lucide-react";
import { TStateGroups } from "types";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedStateGroupFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {values.map((stateGroup) => (
        <div key={stateGroup} className="text-xs flex items-center gap-1 bg-custom-background-80 p-1 rounded">
          <StateGroupIcon stateGroup={stateGroup as TStateGroups} height="12px" width="12px" />
          {stateGroup}
          <button
            type="button"
            className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
            onClick={() => handleRemove(stateGroup)}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
});
