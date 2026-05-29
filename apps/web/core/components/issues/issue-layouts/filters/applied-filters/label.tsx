import { observer } from "mobx-react";

// icons
import { CloseIcon } from "@plane/propel/icons";
import type { IIssueLabel } from "@plane/types";
// types

type Props = {
  handleRemove: (val: string) => void;
  labels: IIssueLabel[] | undefined;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedLabelsFilters = observer(function AppliedLabelsFilters(props: Props) {
  const { handleRemove, labels, values, editable } = props;

  return (
    <>
      {values.map((labelId) => {
        const labelDetails = labels?.find((l) => l.id === labelId);

        if (!labelDetails) return null;

        return (
          <div key={labelId} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
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
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(labelId)}
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
