import { observer } from "mobx-react-lite";

// icons
import { PriorityIcon } from "@plane/ui";
import { X } from "lucide-react";
// types
import { TIssuePriorities } from "@plane/types";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedPriorityFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;

  return (
    <>
      {values.map((priority) => (
        <div key={priority} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
          <PriorityIcon priority={priority as TIssuePriorities} className={`h-3 w-3`} />
          {priority}
          {editable && (
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemove(priority)}
            >
              <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
    </>
  );
});
