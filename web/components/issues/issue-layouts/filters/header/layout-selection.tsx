import React from "react";

// ui
import { Tooltip } from "@plane/ui";
// types
import { TIssueLayouts } from "types";
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
    <div className="flex items-center gap-1 p-1 rounded bg-custom-background-80">
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
        <Tooltip key={layout.key} tooltipContent={layout.title}>
          <button
            type="button"
            className={`w-7 h-[22px] rounded grid place-items-center transition-all hover:bg-custom-background-100 overflow-hidden group ${
              selectedLayout == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
            }`}
            onClick={() => onChange(layout.key)}
          >
            <layout.icon
              size={14}
              strokeWidth={2}
              className={`${selectedLayout == layout.key ? "text-custom-text-100" : "text-custom-text-200"}`}
            />
          </button>
        </Tooltip>
      ))}
    </div>
  );
};
