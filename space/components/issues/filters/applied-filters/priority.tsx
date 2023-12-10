import { PriorityIcon } from "@plane/ui";
import { X } from "lucide-react";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedPriorityFilters: React.FC<Props> = (props) => {
  const { handleRemove, values } = props;

  return (
    <>
      {values &&
        values.length > 0 &&
        values.map((priority) => (
          <div key={priority} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <PriorityIcon priority={priority as any} className={`h-3 w-3`} />
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
    </>
  );
};
