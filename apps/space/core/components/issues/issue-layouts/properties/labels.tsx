"use client";

import { observer } from "mobx-react";
import { Tags } from "lucide-react";
import { Tooltip } from "@plane/ui";
import { useLabel } from "@/hooks/store";

type Props = {
  labelIds: string[];
  shouldShowLabel?: boolean;
};

export const IssueBlockLabels = observer(({ labelIds, shouldShowLabel = false }: Props) => {
  const { getLabelsByIds } = useLabel();

  const labels = getLabelsByIds(labelIds);

  const labelsString = labels.length > 0 ? labels.map((label) => label.name).join(", ") : "No Labels";

  if (labels.length <= 0)
    return (
      <Tooltip position="top" tooltipHeading="Labels" tooltipContent="None">
        <div
          className={`flex h-full items-center justify-center gap-2 rounded px-2.5 py-1 text-xs border-[0.5px] border-custom-border-300`}
        >
          <Tags className="h-3.5 w-3.5" strokeWidth={2} />
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
                className={`flex overflow-hidden h-full max-w-full flex-shrink-0 items-center rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs`}
              >
                <div className="flex max-w-full items-center gap-1.5 overflow-hidden text-custom-text-200">
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
          className={`flex h-full flex-shrink-0 items-center rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs cursor-not-allowed"
            `}
        >
          <Tooltip position="top" tooltipHeading="Labels" tooltipContent={labelsString}>
            <div className="flex h-full items-center gap-1.5 text-custom-text-200">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
              {`${labels.length} Labels`}
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
});
