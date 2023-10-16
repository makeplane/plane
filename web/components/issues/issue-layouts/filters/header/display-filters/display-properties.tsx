import React from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader } from "../helpers/filter-header";
// types
import { IIssueDisplayProperties } from "types";
// constants
import { ISSUE_DISPLAY_PROPERTIES } from "constants/issue";

type Props = {
  displayProperties: IIssueDisplayProperties;
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
};

export const FilterDisplayProperties: React.FC<Props> = observer((props) => {
  const { displayProperties, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  return (
    <>
      <FilterHeader
        title="Display Properties"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {ISSUE_DISPLAY_PROPERTIES.map((displayProperty) => (
            <button
              key={displayProperty.key}
              type="button"
              className={`rounded transition-all text-xs border px-2 py-0.5 ${
                displayProperties?.[displayProperty.key]
                  ? "bg-custom-primary-100 border-custom-primary-100 text-white"
                  : "border-custom-border-200 hover:bg-custom-background-80"
              }`}
              onClick={() =>
                handleUpdate({
                  [displayProperty.key]: !displayProperties?.[displayProperty.key],
                })
              }
            >
              {displayProperty.title}
            </button>
          ))}
        </div>
      )}
    </>
  );
});
