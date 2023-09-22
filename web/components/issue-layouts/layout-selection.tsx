import React from "react";

// types
import { TIssueLayouts } from "types";
// constants
import { ISSUE_LAYOUTS } from "constants/issue";

type Props = {
  layouts: TIssueLayouts[];
  onChange: (layout: TIssueLayouts) => void;
  selectedLayout: TIssueLayouts;
};

export const LayoutSelection: React.FC<Props> = (props) => {
  const { layouts, onChange, selectedLayout } = props;

  return (
    <div className="relative flex items-center p-1 rounded gap-1 bg-custom-background-80">
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
        <div
          key={layout.key}
          className={`w-[28px] h-[22px] rounded flex justify-center items-center cursor-pointer transition-all hover:bg-custom-background-100 overflow-hidden group ${
            selectedLayout == layout.key ? `bg-custom-background-100 shadow shadow-gray-200` : ``
          }}`}
          onClick={() => onChange(layout.key)}
        >
          <layout.icon
            size={14}
            strokeWidth={2}
            className={`${
              selectedLayout == layout.key
                ? `text-custom-text-100`
                : `text-custom-text-100 group-hover:text-custom-text-200`
            }`}
          />
        </div>
      ))}
    </div>
  );
};
