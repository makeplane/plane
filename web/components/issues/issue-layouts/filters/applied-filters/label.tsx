import { observer } from "mobx-react-lite";

// icons
import { X } from "lucide-react";
// types
import { IIssueLabel } from "@plane/types";

type Props = {
  handleRemove: (val: string) => void;
  labels: IIssueLabel[] | undefined;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedLabelsFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, labels, values, editable } = props;

  return (
    <>
      {values.map((labelId) => {
        const labelDetails = labels?.find((l) => l.id === labelId);

        if (!labelDetails) return null;

        return (
          <div key={labelId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: labelDetails.color,
              }}
            />
            <span className="normal-case">{labelDetails.name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(labelId)}
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
