import { useRef } from "react";
//hooks
import { useTableKeyboardNavigation } from "hooks/use-table-keyboard-navigation";
//types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
//components
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { HeaderColumn } from "./columns/header-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  property: keyof IIssueDisplayProperties;
  isEstimateEnabled: boolean;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
}
export const SpreadsheetHeaderColumn = (props: Props) => {
  const { displayProperties, displayFilters, property, isEstimateEnabled, handleDisplayFilterUpdate } = props;

  //hooks
  const tableHeaderCellRef = useRef<HTMLTableCellElement | null>(null);
  const handleKeyBoardNavigation = useTableKeyboardNavigation();

  const shouldRenderProperty = property === "estimate" ? isEstimateEnabled : true;

  return (
    <WithDisplayPropertiesHOC
      displayProperties={displayProperties}
      displayPropertyKey={property}
      shouldRenderProperty={shouldRenderProperty}
    >
      <th
        className="h-11 w-full min-w-[8rem] items-center bg-custom-background-90 text-sm font-medium px-4 py-1 border border-b-0 border-t-0 border-custom-border-100 focus:border-custom-primary-70"
        ref={tableHeaderCellRef}
        tabIndex={0}
        onKeyDown={handleKeyBoardNavigation}
      >
        <HeaderColumn
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          property={property}
          onClose={() => {
            tableHeaderCellRef?.current?.focus();
          }}
        />
      </th>
    </WithDisplayPropertiesHOC>
  );
};
