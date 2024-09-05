import { observer } from "mobx-react";
import { X } from "lucide-react";
// constants
import { NETWORK_CHOICES } from "@/constants/project";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedAccessFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;

  return (
    <>
      {values.map((status) => {
        const accessDetails = NETWORK_CHOICES.find((s) => `${s.key}` === status);
        return (
          <div key={status} className="flex items-center gap-1 rounded px-1.5 py-1 text-xs bg-custom-background-80">
            {accessDetails?.label}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(status)}
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
