import React from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader } from "../helpers/filter-header";
// types
import { IIssueDisplayProperties } from "@plane/types";
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
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {ISSUE_DISPLAY_PROPERTIES.map((displayProperty) => (
            <button
              key={displayProperty.key}
              type="button"
              className={`rounded border px-2 py-0.5 text-xs transition-all ${
                displayProperties?.[displayProperty.key]
                  ? "border-custom-primary-100 bg-custom-primary-100 text-white"
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
