// ui
import { LayersIcon } from "@plane/ui";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
// constants
import { SPREADSHEET_PROPERTY_LIST } from "constants/spreadsheet";
// components
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { SpreadsheetHeaderColumn } from "./spreadsheet-header-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  isEstimateEnabled: boolean;
}

export const SpreadsheetHeader = (props: Props) => {
  const { displayProperties, displayFilters, handleDisplayFilterUpdate, isEstimateEnabled } = props;

  return (
    <thead className="sticky top-0 left-0 z-[2] border-b-[0.5px] border-custom-border-100">
      <tr>
        <th
          className="sticky left-0 z-[2] h-11 w-[28rem] flex items-center bg-custom-background-90 text-sm font-medium before:absolute before:h-full before:right-0 before:border-[0.5px]  before:border-custom-border-100"
          tabIndex={-1}
        >
          <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
            <span className="flex h-full w-24 flex-shrink-0 items-center px-4 py-2.5">
              <span className="mr-1.5 text-custom-text-400">#</span>ID
            </span>
          </WithDisplayPropertiesHOC>
          <span className="flex h-full w-full flex-grow items-center justify-center px-4 py-2.5">
            <LayersIcon className="mr-1.5 h-4 w-4 text-custom-text-400" />
            Issue
          </span>
        </th>

        {SPREADSHEET_PROPERTY_LIST.map((property) => (
          <SpreadsheetHeaderColumn
            property={property}
            displayProperties={displayProperties}
            displayFilters={displayFilters}
            handleDisplayFilterUpdate={handleDisplayFilterUpdate}
            isEstimateEnabled={isEstimateEnabled}
          />
        ))}
      </tr>
    </thead>
  );
};
