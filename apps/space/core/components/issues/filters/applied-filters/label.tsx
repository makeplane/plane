import { CloseIcon } from "@plane/propel/icons";
// types
import type { IIssueLabel } from "@/types/issue";

type Props = {
  handleRemove: (val: string) => void;
  labels: IIssueLabel[] | undefined;
  values: string[];
};

export function AppliedLabelsFilters(props: Props) {
  const { handleRemove, labels, values } = props;

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
            <button
              type="button"
              className="grid place-items-center text-tertiary hover:text-secondary"
              onClick={() => handleRemove(labelId)}
            >
              <CloseIcon height={10} width={10} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </>
  );
}
