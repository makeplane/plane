import { observer } from "mobx-react-lite";

// icons
import { PriorityIcon } from "components/icons";
import { X } from "lucide-react";
// types
import { TIssuePriorities } from "types";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedPriorityFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {values.map((priority) => (
        <div key={priority} className="text-xs flex items-center gap-1 bg-custom-background-80 p-1 rounded">
          <PriorityIcon
            priority={priority as TIssuePriorities}
            className={`!text-xs ${
              priority === "urgent"
                ? "text-red-500"
                : priority === "high"
                ? "text-orange-500"
                : priority === "medium"
                ? "text-yellow-500"
                : priority === "low"
                ? "text-green-500"
                : ""
            }`}
          />
          {priority}
          <button
            type="button"
            className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
            onClick={() => handleRemove(priority)}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
});
