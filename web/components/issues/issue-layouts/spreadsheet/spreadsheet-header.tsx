// ui
import { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
// types
import { LayersIcon } from "@plane/ui";
// components
import { SpreadsheetHeaderColumn } from "@/components/issues/issue-layouts";

interface Props {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  isEstimateEnabled: boolean;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
}

export const SpreadsheetHeader = (props: Props) => {
  const { displayProperties, displayFilters, handleDisplayFilterUpdate, isEstimateEnabled, spreadsheetColumnsList } =
    props;

  return (
    <thead className="sticky top-0 left-0 z-[12] border-b-[0.5px] border-custom-border-100">
      <tr>
        <th
          className="sticky left-0 z-[15] h-11 w-[28rem] flex items-center bg-custom-background-90 text-sm font-medium before:absolute before:h-full before:right-0 before:border-[0.5px]  before:border-custom-border-100"
          tabIndex={-1}
        >
          <span className="flex h-full w-full flex-grow items-center pl-5 px-4 py-2.5">
            <LayersIcon className="mr-1 h-4 w-4 text-custom-text-400" />
            Issue
          </span>
        </th>

        {spreadsheetColumnsList.map((property) => (
          <SpreadsheetHeaderColumn
            key={property}
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
