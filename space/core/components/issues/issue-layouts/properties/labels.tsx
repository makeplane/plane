"use client";

import { observer } from "mobx-react";
import { Tooltip } from "@plane/ui";
import { useLabel } from "@/hooks/store";

type Props = {
  labelIds: string[];
};

export const IssueBlockLabels = observer(({ labelIds }: Props) => {
  const { getLabelsByIds } = useLabel();

  const labels = getLabelsByIds(labelIds);

  const labelsString = labels.map((label) => label.name).join(", ");

  return (
    <div className="relative flex flex-wrap items-center gap-1">
      {labels.length === 1 ? (
        <div
          key={labels[0].id}
          className="flex flex-shrink-0 cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs shadow-sm"
        >
          <div className="flex items-center gap-1.5 text-custom-text-200">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `${labels[0].color}` }} />
            <div className="text-xs">{labels[0].name}</div>
          </div>
        </div>
      ) : (
        <Tooltip tooltipContent={labelsString}>
          <div className="flex flex-shrink-0 cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs shadow-sm">
            <div className="flex items-center gap-1.5 text-custom-text-200">
              <div className="text-xs">{labels.length} Labels</div>
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  );
});
