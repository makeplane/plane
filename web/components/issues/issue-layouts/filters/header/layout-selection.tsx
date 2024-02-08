import React from "react";

// ui
import { Tooltip } from "@plane/ui";
// types
import { TIssueLayouts } from "@plane/types";
// constants
import { ISSUE_LAYOUTS } from "constants/issue";

type Props = {
  layouts: TIssueLayouts[];
  onChange: (layout: TIssueLayouts) => void;
  selectedLayout: TIssueLayouts | undefined;
};

export const LayoutSelection: React.FC<Props> = (props) => {
  const { layouts, onChange, selectedLayout } = props;

  return (
    <div className="flex items-center gap-1 rounded bg-neutral-component-surface-dark p-1">
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
        <Tooltip key={layout.key} tooltipContent={layout.title}>
          <button
            type="button"
            className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-neutral-component-surface-light ${
              selectedLayout == layout.key ? "bg-neutral-component-surface-light shadow-custom-shadow-2xs" : ""
            }`}
            onClick={() => onChange(layout.key)}
          >
            <layout.icon
              size={14}
              strokeWidth={2}
              className={`h-3.5 w-3.5 ${
                selectedLayout == layout.key ? "text-neutral-text-strong" : "text-neutral-text-medium"
              }`}
            />
          </button>
        </Tooltip>
      ))}
    </div>
  );
};
