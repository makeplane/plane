import React from "react";
import { observer } from "mobx-react";
import { IIssueDisplayProperties } from "@plane/types";
// components
import { ISSUE_DISPLAY_PROPERTIES } from "@/constants/issue";
import { FilterHeader } from "../helpers/filter-header";
// types
// constants

type Props = {
  displayProperties: IIssueDisplayProperties;
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  cycleViewDisabled?: boolean;
  moduleViewDisabled?: boolean;
};

export const FilterDisplayProperties: React.FC<Props> = observer((props) => {
  const { displayProperties, handleUpdate, cycleViewDisabled = false, moduleViewDisabled = false } = props;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  // Filter out "cycle" and "module" keys if cycleViewDisabled or moduleViewDisabled is true
  const filteredDisplayProperties = ISSUE_DISPLAY_PROPERTIES.filter((property) => {
    if (cycleViewDisabled && property.key === "cycle") return false;
    if (moduleViewDisabled && property.key === "modules") return false;
    return true;
  });

  return (
    <>
      <FilterHeader
        title="Display Properties"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {filteredDisplayProperties.map((displayProperty) => (
            <>
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
            </>
          ))}
        </div>
      )}
    </>
  );
});
