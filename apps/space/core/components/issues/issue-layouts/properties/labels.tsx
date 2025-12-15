import { observer } from "mobx-react";
import { LabelPropertyIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useLabel } from "@/hooks/store/use-label";

type Props = {
  labelIds: string[];
  shouldShowLabel?: boolean;
};

export const IssueBlockLabels = observer(function IssueBlockLabels({ labelIds, shouldShowLabel = false }: Props) {
  const { getLabelsByIds } = useLabel();

  const labels = getLabelsByIds(labelIds);

  const labelsString = labels.length > 0 ? labels.map((label) => label.name).join(", ") : "No Labels";

  if (labels.length <= 0)
    return (
      <Tooltip position="top" tooltipHeading="Labels" tooltipContent="None">
        <div
          className={`flex h-full items-center justify-center gap-2 rounded-sm px-2.5 py-1 text-11 border-[0.5px] border-strong`}
        >
          <LabelPropertyIcon className="h-3.5 w-3.5" strokeWidth={2} />
          {shouldShowLabel && <span>No Labels</span>}
        </div>
      </Tooltip>
    );

  return (
    <div className="flex h-5 w-full flex-wrap items-center gap-2 overflow-hidden">
      {labels.length <= 2 ? (
        <>
          {labels.map((label) => (
            <Tooltip key={label.id} position="top" tooltipHeading="Labels" tooltipContent={label?.name ?? ""}>
              <div
                key={label?.id}
                className={`flex overflow-hidden h-full max-w-full flex-shrink-0 items-center rounded-sm border-[0.5px] border-strong px-2.5 py-1 text-11`}
              >
                <div className="flex max-w-full items-center gap-1.5 overflow-hidden text-secondary">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: label?.color ?? "#000000",
                    }}
                  />
                  <div className="line-clamp-1 inline-block w-auto max-w-[100px] truncate">{label?.name}</div>
                </div>
              </div>
            </Tooltip>
          ))}
        </>
      ) : (
        <div
          className={`flex h-full flex-shrink-0 items-center rounded-sm border-[0.5px] border-strong px-2.5 py-1 text-11 cursor-not-allowed"
            `}
        >
          <Tooltip position="top" tooltipHeading="Labels" tooltipContent={labelsString}>
            <div className="flex h-full items-center gap-1.5 text-secondary">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent-primary" />
              {`${labels.length} Labels`}
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
});
