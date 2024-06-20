import { observer } from "mobx-react";
import { X } from "lucide-react";
import { CYCLE_STATUS } from "@/constants/cycle";
import { cn } from "@/helpers/common.helper";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedStatusFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;

  return (
    <>
      {values.map((status) => {
        const statusDetails = CYCLE_STATUS.find((s) => s.value === status);
        return (
          <div
            key={status}
            className={cn(
              "flex items-center gap-1 rounded p-1 text-xs",
              statusDetails?.bgColor,
              statusDetails?.textColor
            )}
          >
            {statusDetails?.title}
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
